import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:jspdf-autotable@3.8.4';

const TARGET_DAYS = 60;
const WORKING_DAYS_PER_WEEK = 6;

const normalize = (value) => (value || 'INCONNUE').toString().trim().toUpperCase() || 'INCONNUE';
const toDate = (value) => value ? new Date(value) : null;
const formatDate = (date) => date ? date.toLocaleDateString('fr-FR') : '—';
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const percent = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;
const number = (value) => String(Math.round(Number(value || 0)));

const countWorkingDays = (startDate, endDate = new Date()) => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    if (current.getDay() !== 0) days += 1;
    current.setDate(current.getDate() + 1);
  }
  return Math.max(days, 1);
};

const estimateEndDate = (remaining, dailyRate) => {
  if (!dailyRate || dailyRate <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(remaining / dailyRate));
  return date;
};

const getPeriodRange = (body) => {
  if (body.date_debut || body.date_fin) {
    const start = body.date_debut ? new Date(`${body.date_debut}T00:00:00`) : new Date('1970-01-01T00:00:00');
    const end = body.date_fin ? new Date(`${body.date_fin}T23:59:59`) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = body.weekStart ? new Date(body.weekStart) : new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const addTitle = (doc, title, y) => {
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(title, 14, y);
  doc.setTextColor(15, 23, 42);
  return y + 6;
};

const ensureSpace = (doc, y, needed = 35) => {
  if (y + needed > 285) {
    doc.addPage();
    return 16;
  }
  return y;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'superviseur' && user.role !== 'admin')) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { start, end } = getPeriodRange(body);
    const organisationId = body.organisation_id || user.organisation_id;

    if (!organisationId) {
      return Response.json({ error: 'Organisation introuvable' }, { status: 400 });
    }

    const [collectes, cadastres, convocations] = await Promise.all([
      base44.asServiceRole.entities.Collecte.filter({ organisation_id: organisationId }, '-created_date'),
      base44.asServiceRole.entities.CadastreCommunal.filter({ organisation_id: organisationId }),
      base44.asServiceRole.entities.ConvocationParcelle.filter({ organisation_id: organisationId, statut: 'active' })
    ]);

    const supervisedCommunes = user.role === 'superviseur' && Array.isArray(user.communes_supervisees) ? user.communes_supervisees.map(normalize) : [];
    const allowed = (commune) => user.role !== 'superviseur' || supervisedCommunes.length === 0 || supervisedCommunes.includes(normalize(commune));

    const roleCollectes = collectes.filter((c) => allowed(c.commune));
    const filteredCadastres = cadastres.filter((c) => allowed(c.commune));
    const roleConvocations = convocations.filter((c) => allowed(c.commune));
    const filteredCollectes = roleCollectes.filter((c) => {
      const date = toDate(c.date_collecte || c.created_date);
      return date && date >= start && date <= end;
    });
    const filteredConvocations = roleConvocations.filter((c) => {
      const date = toDate(c.created_date);
      return date && date >= start && date <= end;
    });
    const weekCollectes = filteredCollectes;

    const cadastralTotal = filteredCadastres.reduce((sum, item) => sum + Number(item.nombre_parcelles || 0), 0);
    const totalCollectes = filteredCollectes.length;
    const totalValidees = filteredCollectes.filter((c) => c.statut === 'validee').length;
    const totalBrouillons = filteredCollectes.filter((c) => c.statut === 'brouillon').length;
    const totalCompletes = filteredCollectes.filter((c) => c.statut === 'complete').length;
    const remaining = Math.max(cadastralTotal - totalValidees, 0);
    const firstDate = filteredCollectes.map((c) => toDate(c.date_collecte || c.created_date)).filter(Boolean).sort((a, b) => a - b)[0];
    const workingDays = countWorkingDays(firstDate);
    const dailyRate = totalCollectes / workingDays;
    const weeklyRate = dailyRate * WORKING_DAYS_PER_WEEK;
    const activeAgents = new Set(filteredCollectes.map((c) => c.signature_agent).filter(Boolean)).size || 1;
    const targetDaily = activeAgents * 20;
    const targetWeekly = targetDaily * WORKING_DAYS_PER_WEEK;
    const endEstimate = estimateEndDate(remaining, dailyRate);
    const delayRisk = dailyRate < targetDaily;

    const cadastralByCommune = {};
    filteredCadastres.forEach((c) => {
      const commune = normalize(c.commune);
      cadastralByCommune[commune] = (cadastralByCommune[commune] || 0) + Number(c.nombre_parcelles || 0);
    });

    const statsByCommune = {};
    filteredCollectes.forEach((c) => {
      const commune = normalize(c.commune);
      if (!statsByCommune[commune]) statsByCommune[commune] = { total: 0, validee: 0, brouillon: 0, complete: 0, periode: 0, dates: [] };
      statsByCommune[commune].total += 1;
      statsByCommune[commune][c.statut || 'brouillon'] += 1;
      const date = toDate(c.date_collecte || c.created_date);
      if (date) statsByCommune[commune].dates.push(date);
      statsByCommune[commune].periode += 1;
    });
    Object.keys(cadastralByCommune).forEach((commune) => {
      if (!statsByCommune[commune]) statsByCommune[commune] = { total: 0, validee: 0, brouillon: 0, complete: 0, periode: 0, dates: [] };
    });

    const communeRows = Object.entries(statsByCommune).sort((a, b) => a[0].localeCompare(b[0])).map(([commune, stats]) => {
      const charge = cadastralByCommune[commune] || 0;
      const communeFirstDate = stats.dates.length ? new Date(Math.min(...stats.dates.map((d) => d.getTime()))) : null;
      const communeDaily = stats.total / countWorkingDays(communeFirstDate);
      const communeRemaining = Math.max(charge - stats.validee, 0);
      const status = communeDaily >= (charge / TARGET_DAYS) ? 'Bon rythme' : stats.total === 0 ? 'À démarrer' : 'Renforcer';
      return [commune, number(charge), number(stats.total), number(stats.periode), number(stats.validee), `${percent(stats.validee, charge)}%`, communeDaily.toFixed(1), formatDate(estimateEndDate(communeRemaining, communeDaily)), status];
    });

    const statsByAgent = {};
    filteredCollectes.forEach((c) => {
      const agent = c.signature_agent || 'Non renseigné';
      if (!statsByAgent[agent]) statsByAgent[agent] = { total: 0, validee: 0, brouillon: 0, periode: 0, communes: new Set(), dates: [] };
      statsByAgent[agent].total += 1;
      statsByAgent[agent][c.statut || 'brouillon'] += 1;
      if (c.commune) statsByAgent[agent].communes.add(normalize(c.commune));
      const date = toDate(c.date_collecte || c.created_date);
      if (date) statsByAgent[agent].dates.push(date);
      statsByAgent[agent].periode += 1;
    });

    const agentRows = Object.entries(statsByAgent).sort((a, b) => b[1].total - a[1].total).map(([agent, stats]) => {
      const agentFirstDate = stats.dates.length ? new Date(Math.min(...stats.dates.map((d) => d.getTime()))) : null;
      const agentDaily = stats.total / countWorkingDays(agentFirstDate);
      return [agent, number(stats.total), number(stats.periode), number(stats.validee), number(stats.brouillon), agentDaily.toFixed(1), Array.from(stats.communes).join(', ') || '—'];
    });

    const dailyItems = [];
    const daysInPeriod = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1);
    Array.from({ length: daysInPeriod }).forEach((_, index) => {
      const day = addDays(start, index);
      const count = weekCollectes.filter((c) => {
        const date = toDate(c.date_collecte || c.created_date);
        return date && date.toDateString() === day.toDateString();
      }).length;
      dailyItems.push([
        day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        number(count)
      ]);
    });

    const periodRows = [];
    for (let i = 0; i < dailyItems.length; i += 4) {
      const row = [];
      dailyItems.slice(i, i + 4).forEach(([label, value]) => row.push(label, value));
      while (row.length < 8) row.push('', '');
      periodRows.push(row);
    }

    const recommendations = [];
    if (delayRisk) recommendations.push(`Le rythme réel (${dailyRate.toFixed(1)}/jour) est inférieur à l'objectif théorique (${targetDaily}/jour, soit 20 par agent) : renforcer immédiatement les équipes ou augmenter la cadence.`);
    if (totalBrouillons > 0) recommendations.push(`${number(totalBrouillons)} brouillon(s) doivent être finalisés rapidement pour améliorer le taux de validation.`);
    const weakCommunes = communeRows.filter((row) => row[8] !== 'Bon rythme').slice(0, 3).map((row) => row[0]);
    if (weakCommunes.length) recommendations.push(`Prioriser les communes en retard : ${weakCommunes.join(', ')}.`);
    const weakAgents = agentRows.filter((row) => Number(row[5]) < 10).slice(0, 3).map((row) => row[0]);
    if (weakAgents.length) recommendations.push(`Accompagner ou redéployer les agents à faible cadence : ${weakAgents.join(', ')}.`);
    if (!recommendations.length) recommendations.push('La dynamique actuelle est favorable : maintenir le rythme et contrôler la qualité des validations chaque semaine.');

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('RAPPORT D’ACTIVITÉ DU RECENSEMENT', 148, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Période : ${formatDate(start)} au ${formatDate(end)} • Généré le ${formatDate(new Date())}`, 148, 23, { align: 'center' });

    let y = 34;
    y = addTitle(doc, '1. Chiffres globaux', y);
    doc.autoTable({
      startY: y,
      head: [['Parcelles cadastrales', 'Total recensé', 'Validées', 'Brouillons', 'Convocations', 'Avancement', 'Rythme/jour', 'Objectif/jour', 'Fin estimée']],
      body: [[number(cadastralTotal), number(totalCollectes), number(totalValidees), number(totalBrouillons), number(filteredConvocations.length), `${percent(totalValidees, cadastralTotal)}%`, dailyRate.toFixed(1), number(targetDaily), formatDate(endEstimate)]],
      styles: { fontSize: 8, cellPadding: 3, minCellHeight: 9, halign: 'center' },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
    y = addTitle(doc, '2. Évolution de la période sélectionnée', y);
    doc.autoTable({
      startY: y,
      head: [['Date', 'Collectes', 'Date', 'Collectes', 'Date', 'Collectes', 'Date', 'Collectes']],
      body: periodRows,
      styles: { fontSize: 7.5, cellPadding: 2, minCellHeight: 7, halign: 'center' },
      headStyles: { fillColor: [37, 99, 235], halign: 'center' },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
    y = ensureSpace(doc, y, 55);
    y = addTitle(doc, '3. Performance par commune', y);
    doc.autoTable({
      startY: y,
      head: [['Commune', 'Charge', 'Total', 'Période', 'Validées', 'Avanc.', 'Rythme/j', 'Fin estimée', 'Statut']],
      body: communeRows,
      styles: { fontSize: 7.5, cellPadding: 3, minCellHeight: 9, halign: 'center' },
      headStyles: { fillColor: [22, 101, 52], halign: 'center' },
      margin: { left: 14, right: 14 }
    });

    doc.addPage();
    y = 16;
    y = addTitle(doc, '4. Performance par agent', y);
    doc.autoTable({
      startY: y,
      head: [['Agent', 'Total', 'Période', 'Validées', 'Brouillons', 'Rythme/j', 'Communes']],
      body: agentRows.length ? agentRows : [['Aucun agent', '0', '0', '0', '0', '0.0', '—']],
      styles: { fontSize: 7.5, cellPadding: 3, minCellHeight: 9, halign: 'center' },
      headStyles: { fillColor: [124, 45, 18], halign: 'center' },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
    y = ensureSpace(doc, y, 45);
    y = addTitle(doc, '5. Recommandations', y);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    recommendations.forEach((rec, index) => {
      y = ensureSpace(doc, y, 12);
      const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 260);
      doc.text(lines, 18, y);
      y += lines.length * 5 + 2;
    });

    const pdfBuffer = doc.output('arraybuffer');
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return Response.json({
      success: true,
      file: base64,
      filename: `rapport_periode_recensement_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf'
    });
  } catch (error) {
    console.error('Rapport hebdomadaire error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});