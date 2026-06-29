/**
 * Export collectes to GeoPackage (GPKG) format using sql.js
 * GeoPackage spec: https://www.geopackage.org/spec/
 */

let SQL = null;

async function initSqlJs() {
  if (SQL) return SQL;
  try {
    const initSqlJs = (await import('sql.js')).default;
    SQL = await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    return SQL;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de SQL.js:', error);
    throw new Error('Impossible de charger la librairie d\'export. Veuillez vérifier votre connexion Internet.');
  }
}

/**
 * Encode a WKB Point geometry (little-endian) with GeoPackage header
 * GeoPackage geometry blob = GPKG header (8 bytes) + WKB geometry
 */
function encodeGpkgPoint(longitude, latitude) {
  // GPKG geometry header
  // Magic: 0x47 0x50 (GP)
  // Version: 0x00
  // Flags: 0x01 (little endian, standard WKB, no envelope)
  // SRS ID: 4326 (4 bytes little endian)
  const header = new ArrayBuffer(8);
  const headerView = new DataView(header);
  headerView.setUint8(0, 0x47); // G
  headerView.setUint8(1, 0x50); // P
  headerView.setUint8(2, 0x00); // version
  headerView.setUint8(3, 0x01); // flags: little-endian, standard, no envelope
  headerView.setInt32(4, 4326, true); // SRS ID

  // WKB Point (little-endian)
  // byte order (1) + geometry type (4) + X (8) + Y (8) = 21 bytes
  const wkb = new ArrayBuffer(21);
  const wkbView = new DataView(wkb);
  wkbView.setUint8(0, 1);        // little endian
  wkbView.setUint32(1, 1, true); // geometry type = Point
  wkbView.setFloat64(5, longitude, true);
  wkbView.setFloat64(13, latitude, true);

  // Concatenate header + WKB
  const result = new Uint8Array(8 + 21);
  result.set(new Uint8Array(header), 0);
  result.set(new Uint8Array(wkb), 8);
  return result;
}

export async function exportCollectesToGpkg(collectes, filename = 'collectes.gpkg') {
  const SqlJs = await initSqlJs();
  const db = new SqlJs.Database();

  // Required GeoPackage tables
  db.run(`
    CREATE TABLE gpkg_spatial_ref_sys (
      srs_name TEXT NOT NULL,
      srs_id INTEGER NOT NULL PRIMARY KEY,
      organization TEXT NOT NULL,
      organization_coordsys_id INTEGER NOT NULL,
      definition TEXT NOT NULL,
      description TEXT
    )
  `);

  // Insert WGS84 SRS
  db.run(`
    INSERT INTO gpkg_spatial_ref_sys VALUES (
      'WGS 84 geodetic', 4326, 'EPSG', 4326,
      'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]',
      'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid'
    )
  `);
  db.run(`
    INSERT INTO gpkg_spatial_ref_sys VALUES (
      'Undefined cartesian SRS', -1, 'NONE', -1, 'undefined', 'undefined cartesian coordinate reference system'
    )
  `);
  db.run(`
    INSERT INTO gpkg_spatial_ref_sys VALUES (
      'Undefined geographic SRS', 0, 'NONE', 0, 'undefined', 'undefined geographic coordinate reference system'
    )
  `);

  db.run(`
    CREATE TABLE gpkg_contents (
      table_name TEXT NOT NULL PRIMARY KEY,
      data_type TEXT NOT NULL,
      identifier TEXT,
      description TEXT DEFAULT '',
      last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      min_x REAL,
      min_y REAL,
      max_x REAL,
      max_y REAL,
      srs_id INTEGER,
      CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
    )
  `);

  db.run(`
    CREATE TABLE gpkg_geometry_columns (
      table_name TEXT NOT NULL,
      column_name TEXT NOT NULL,
      geometry_type_name TEXT NOT NULL,
      srs_id INTEGER NOT NULL,
      z TINYINT NOT NULL,
      m TINYINT NOT NULL,
      CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
      CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
      CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
    )
  `);

  // Create the collectes feature table
  db.run(`
    CREATE TABLE collectes (
      fid INTEGER PRIMARY KEY AUTOINCREMENT,
      geom BLOB,
      id TEXT,
      commune TEXT,
      quartier TEXT,
      section TEXT,
      parcelle TEXT,
      reference_dgi TEXT,
      nature TEXT,
      surface_imposable REAL,
      valeur_venale REAL,
      type_proprietaire TEXT,
      prop_nom TEXT,
      prop_prenoms TEXT,
      societe_raison_sociale TEXT,
      statut TEXT,
      date_collecte TEXT,
      signature_agent TEXT,
      longitude REAL,
      latitude REAL
    )
  `);

  // Register in gpkg_geometry_columns
  db.run(`
    INSERT INTO gpkg_geometry_columns VALUES ('collectes', 'geom', 'POINT', 4326, 0, 0)
  `);

  // Insert data
  const stmt = db.prepare(`
    INSERT INTO collectes (
      geom, id, commune, quartier, section, parcelle, reference_dgi,
      nature, surface_imposable, valeur_venale, type_proprietaire,
      prop_nom, prop_prenoms, societe_raison_sociale, statut,
      date_collecte, signature_agent, longitude, latitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Compute bbox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasGeom = false;

  const geoCollectes = collectes.filter(c => c.longitude != null && c.latitude != null);

  collectes.forEach(c => {
    let geomBlob = null;
    if (c.longitude != null && c.latitude != null) {
      geomBlob = encodeGpkgPoint(c.longitude, c.latitude);
      minX = Math.min(minX, c.longitude);
      minY = Math.min(minY, c.latitude);
      maxX = Math.max(maxX, c.longitude);
      maxY = Math.max(maxY, c.latitude);
      hasGeom = true;
    }

    stmt.run([
      geomBlob,
      c.id || null,
      c.commune || null,
      c.quartier || null,
      c.section || null,
      c.parcelle || null,
      c.reference_dgi || null,
      c.nature || null,
      c.surface_imposable || null,
      c.valeur_venale || null,
      c.type_proprietaire || null,
      c.prop_nom || null,
      c.prop_prenoms || null,
      c.societe_raison_sociale || null,
      c.statut || null,
      c.date_collecte || null,
      c.signature_agent || null,
      c.longitude || null,
      c.latitude || null,
    ]);
  });

  stmt.free();

  // Register in gpkg_contents
  db.run(`
    INSERT INTO gpkg_contents VALUES (
      'collectes', 'features', 'collectes', 'Collectes foncières',
      strftime('%Y-%m-%dT%H:%M:%fZ','now'),
      ?, ?, ?, ?, 4326
    )
  `, [
    hasGeom ? minX : null,
    hasGeom ? minY : null,
    hasGeom ? maxX : null,
    hasGeom ? maxY : null,
  ]);

  // Export to binary
  const binaryArray = db.export();
  db.close();

  // Download
  const blob = new Blob([binaryArray], { type: 'application/geopackage+sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { total: collectes.length, withGeometry: geoCollectes.length };
}