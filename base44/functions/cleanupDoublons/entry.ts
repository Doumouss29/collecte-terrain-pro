import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalize(val) {
  return String(val == null ? '' : val).trim().toUpperCase();
}

function makeKey(lot, ilot, commune, section) {
  return [normalize(lot), normalize(ilot), normalize(commune), normalize(section)].join('|');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  const body = await req.json().catch(() => ({}));
  const commune = body.commune ? String(body.commune).trim().toUpperCase() : null;
  // section is optional — if omitted, process ALL sections for the commune
  const sectionFilter = body.section ? String(body.section).trim().toUpperCase() : null;

  if (!commune) {
    return Response.json({ error: 'commune is required' }, { status: 400 });
  }

  // 1. Load ALL convocations for this commune (optionally filtered by section)
  const convocations = [];
  let skip = 0;
  const convFilter = sectionFilter ? { commune, section: sectionFilter } : { commune };
  while (true) {
    const batch = await client.entities.ConvocationParcelle.filter(
      convFilter, '-created_date', 500, skip
    );
    if (!batch || batch.length === 0) break;
    for (const item of batch) {
      convocations.push({ id: item.id, lot: item.lot, ilot: item.ilot, section: normalize(item.section) });
    }
    if (batch.length < 500) break;
    skip += 500;
  }

  if (convocations.length === 0) {
    return Response.json({ deleted_count: 0, message: `Aucune convocation pour ${commune}${sectionFilter ? '/' + sectionFilter : ''}` });
  }

  // 2. Find all unique sections present in convocations
  const sections = [...new Set(convocations.map(c => c.section))];

  // 3. For each section, load collecte keys
  const collecteKeys = new Set();
  for (const section of sections) {
    let s = 0;
    while (true) {
      const batch = await client.entities.Collecte.filter(
        { commune, section }, '-created_date', 50, s
      );
      if (!batch || batch.length === 0) break;
      for (const c of batch) {
        collecteKeys.add(makeKey(c.lot, c.ilot, commune, normalize(c.section)));
      }
      if (batch.length < 50) break;
      s += 50;
    }
  }

  // 4. Find and delete duplicates
  const toDelete = [];
  for (const conv of convocations) {
    if (collecteKeys.has(makeKey(conv.lot, conv.ilot, commune, conv.section))) {
      toDelete.push(conv.id);
    }
  }

  for (const id of toDelete) {
    await client.entities.ConvocationParcelle.delete(id);
  }

  return Response.json({
    commune,
    sections_checked: sections,
    convocations_checked: convocations.length,
    collectes_found: collecteKeys.size,
    deleted_count: toDelete.length,
    message: `${toDelete.length} supprimée(s) pour ${commune} (${sections.length} sections)`
  });
});