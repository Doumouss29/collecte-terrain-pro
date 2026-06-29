import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3001);
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL est obligatoire');
}

const shouldUseSsl =
  process.env.DATABASE_SSL === 'true' ||
  connectionString.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
});

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '35mb' }));
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

function normalize(row) {
  return {
    id: row.id,
    ...row.data,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

function applyFilter(records, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return records;
  return records.filter((record) =>
    Object.entries(filter).every(([key, expected]) => {
      const current = record[key];
      if (Array.isArray(expected)) return expected.includes(current);
      if (expected && typeof expected === 'object' && '$in' in expected) {
        return expected.$in.includes(current);
      }
      return current === expected;
    })
  );
}

function applySort(records, sort) {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return desc ? 1 : -1;
    if (bv == null) return desc ? -1 : 1;
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

async function ensureAdminUser() {
  const email = process.env.DEV_USER_EMAIL || 'admin@local.test';
  const userData = {
    email,
    full_name: process.env.DEV_USER_NAME || 'Administrateur Collecte',
    first_name: process.env.DEV_USER_FIRST_NAME || 'Administrateur',
    last_name: process.env.DEV_USER_LAST_NAME || 'Collecte',
    role: process.env.DEV_USER_ROLE || 'admin',
    status: 'actif',
    communes_supervisees: [],
  };

  const existing = await pool.query(
    "SELECT * FROM base44_records WHERE entity='User' AND data->>'email'=$1 LIMIT 1",
    [email]
  );
  if (existing.rows.length) {
    const row = existing.rows[0];
    const merged = { ...row.data, ...userData };
    const updated = await pool.query(
      'UPDATE base44_records SET data=$1::jsonb, updated_date=now() WHERE id=$2 RETURNING *',
      [JSON.stringify(merged), row.id]
    );
    return normalize(updated.rows[0]);
  }
  const created = await pool.query(
    "INSERT INTO base44_records(entity, data) VALUES('User', $1::jsonb) RETURNING *",
    [JSON.stringify(userData)]
  );
  return normalize(created.rows[0]);
}

async function createCollectePdf(collecteId) {
  const result = await pool.query(
    "SELECT * FROM base44_records WHERE entity='Collecte' AND id=$1 LIMIT 1",
    [collecteId]
  );
  if (!result.rows.length) throw new Error('Collecte introuvable');
  const collecte = normalize(result.rows[0]);

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(18).text('Rapport de collecte terrain', { align: 'center' });
  doc.moveDown();
  const fields = [
    ['Identifiant', collecte.id],
    ['Commune', collecte.commune],
    ['Section', collecte.section],
    ['Parcelle', collecte.parcelle],
    ['Lot', collecte.lot],
    ['Îlot', collecte.ilot],
    ['Quartier', collecte.quartier],
    ['Statut', collecte.statut],
    ['Agent', collecte.created_by],
    ['Date de création', collecte.created_date],
    ['Propriétaire', [collecte.prop_nom, collecte.prop_prenoms].filter(Boolean).join(' ')],
    ['Téléphone', collecte.prop_tel],
  ];
  doc.fontSize(11);
  for (const [label, value] of fields) {
    if (value !== undefined && value !== null && value !== '') {
      doc.font('Helvetica-Bold').text(`${label} :`, { continued: true });
      doc.font('Helvetica').text(` ${String(value)}`);
    }
  }
  doc.moveDown();
  doc.fontSize(8).fillColor('gray').text('Document généré par Collecte Terrain Pro.');
  doc.end();
  return completed;
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'error', error: error.message });
  }
});

app.get('/api/apps/public/prod/public-settings/by-id/:appId', (req, res) => {
  res.json({ id: req.params.appId || 'local', public_settings: { requiresAuth: false } });
});

app.get('/api/auth/me', async (_req, res, next) => {
  try { res.json(await ensureAdminUser()); } catch (error) { next(error); }
});

app.patch('/api/auth/me', async (req, res, next) => {
  try {
    const current = await ensureAdminUser();
    const result = await pool.query(
      "UPDATE base44_records SET data=data || $1::jsonb, updated_date=now() WHERE entity='User' AND id=$2 RETURNING *",
      [JSON.stringify(req.body || {}), current.id]
    );
    res.json(normalize(result.rows[0]));
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', (_req, res) => res.json({ ok: true }));
app.post('/api/auth/login', (_req, res) => res.json({ ok: true }));
app.post('/api/app-logs', (_req, res) => res.json({ ok: true }));

app.get('/api/entities/:entity', async (req, res, next) => {
  try {
    const { entity } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const sort = req.query.sort || '';
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await pool.query('SELECT * FROM base44_records WHERE entity=$1', [entity]);
    let rows = result.rows.map(normalize);
    rows = applyFilter(rows, filter);
    rows = applySort(rows, sort);
    if (limit) rows = rows.slice(0, limit);
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/entities/:entity', async (req, res, next) => {
  try {
    const { entity } = req.params;
    const body = { ...(req.body || {}) };
    if (!body.created_by) body.created_by = (process.env.DEV_USER_EMAIL || 'admin@local.test');
    const result = await pool.query(
      'INSERT INTO base44_records(entity, data) VALUES($1, $2::jsonb) RETURNING *',
      [entity, JSON.stringify(body)]
    );
    res.status(201).json(normalize(result.rows[0]));
  } catch (error) { next(error); }
});

app.patch('/api/entities/:entity/:id', async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const result = await pool.query(
      'UPDATE base44_records SET data=data || $1::jsonb, updated_date=now() WHERE entity=$2 AND id=$3 RETURNING *',
      [JSON.stringify(req.body || {}), entity, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(normalize(result.rows[0]));
  } catch (error) { next(error); }
});

app.delete('/api/entities/:entity/:id', async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    await pool.query('DELETE FROM base44_records WHERE entity=$1 AND id=$2', [entity, id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
  res.json({ file_url: `${baseUrl}/uploads/${req.file.filename}` });
});

app.post('/api/functions/:name', async (req, res, next) => {
  try {
    if (req.params.name === 'exportCollectePdf') {
      const pdf = await createCollectePdf(req.body?.collecteId);
      return res.json({ data: { success: true, file: pdf.toString('base64') } });
    }
    res.json({ data: { success: true }, ok: true });
  } catch (error) { next(error); }
});

app.post('/api/users/invite', async (req, res, next) => {
  try {
    const { email, role = 'user' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email obligatoire' });
    res.json({ ok: true, email, role, warning: 'Envoi email non configuré' });
  } catch (error) { next(error); }
});

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Erreur interne' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Collecte Terrain API listening on port ${PORT}`);
});
