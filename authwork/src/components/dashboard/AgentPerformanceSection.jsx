import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, MapPin, Calendar, Users } from 'lucide-react';

const DAILY_TARGET = 20;
const WORK_DAYS_PER_WEEK = 6;
const WEEKLY_TARGET = DAILY_TARGET * WORK_DAYS_PER_WEEK;

const normalizeCommune = (value) => value?.trim().toUpperCase() || 'INCONNUE';

const getCollecteDate = (collecte) => {
  const rawDate = collecte.date_collecte || collecte.created_date;
  return rawDate ? new Date(rawDate) : null;
};

const countWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
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

const formatNumber = (value) => Math.round(value || 0).toLocaleString('fr-FR');

const formatDate = (date) => date
  ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

function MetricCard({ icon: Icon, title, value, subtitle, colorClass }) {
  return (
    <Card className="border-0 shadow-md bg-white">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentPerformanceSection({ collectes, cadastres }) {
  const today = new Date();
  const agents = {};
  const collectesList = collectes || [];
  const cadastresList = cadastres || [];
  const validatedCount = collectesList.filter(c => c.statut === 'validee').length;

  collectesList.forEach((collecte) => {
    const agent = collecte.signature_agent || 'Non renseigné';
    const date = getCollecteDate(collecte);
    if (!agents[agent]) agents[agent] = { total: 0, dates: [] };
    agents[agent].total += 1;
    if (date) agents[agent].dates.push(date);
  });

  const agentRows = Object.entries(agents)
    .map(([name, stats]) => {
      const firstDate = stats.dates.length ? new Date(Math.min(...stats.dates.map(d => d.getTime()))) : today;
      const workingDays = countWorkingDays(firstDate, today);
      const averagePerDay = stats.total / workingDays;
      const averagePerWeek = averagePerDay * WORK_DAYS_PER_WEEK;
      const targetRate = Math.round((averagePerWeek / WEEKLY_TARGET) * 100);
      return { name, ...stats, averagePerDay, averagePerWeek, targetRate };
    })
    .sort((a, b) => b.total - a.total);

  const firstCollecteDate = collectesList
    .map(getCollecteDate)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];
  const globalWorkingDays = countWorkingDays(firstCollecteDate, today);
  const globalDailyRhythm = collectesList.length > 0 ? collectesList.length / globalWorkingDays : 0;
  const globalWeeklyRhythm = globalDailyRhythm * WORK_DAYS_PER_WEEK;

  const cadastralByCommune = cadastresList.reduce((acc, cadastre) => {
    const commune = normalizeCommune(cadastre.commune);
    acc[commune] = (acc[commune] || 0) + Number(cadastre.nombre_parcelles || 0);
    return acc;
  }, {});

  const totalCadastralParcels = Object.values(cadastralByCommune).reduce((sum, count) => sum + count, 0);
  const remainingParcels = Math.max(totalCadastralParcels - validatedCount, 0);
  const estimatedDays = globalDailyRhythm > 0 ? Math.ceil(remainingParcels / globalDailyRhythm) : null;
  const estimatedEndDate = estimatedDays !== null ? new Date(today.getTime() + estimatedDays * 24 * 60 * 60 * 1000) : null;
  const progressRate = totalCadastralParcels > 0 ? Math.min(100, Math.round((validatedCount / totalCadastralParcels) * 100)) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-800" />
        Performance des agents
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Target}
          title="Objectif théorique"
          value={`${WEEKLY_TARGET}/sem.`}
          subtitle={`${DAILY_TARGET} recensements/jour × ${WORK_DAYS_PER_WEEK} jours`}
          colorClass="bg-blue-100 text-blue-700"
        />
        <MetricCard
          icon={Users}
          title="Performance réelle"
          value={`${formatNumber(globalDailyRhythm)}/jour`}
          subtitle={`${formatNumber(globalWeeklyRhythm)} recensements/semaine tous agents`}
          colorClass="bg-green-100 text-green-700"
        />
        <MetricCard
          icon={MapPin}
          title="Avancement cadastral"
          value={`${progressRate}%`}
          subtitle={`${formatNumber(validatedCount)} validées / ${formatNumber(totalCadastralParcels)} parcelles chargées`}
          colorClass="bg-purple-100 text-purple-700"
        />
        <MetricCard
          icon={Calendar}
          title="Estimation fin"
          value={estimatedDays !== null ? formatDate(estimatedEndDate) : '—'}
          subtitle={`${formatNumber(remainingParcels)} parcelles restantes`}
          colorClass="bg-amber-100 text-amber-700"
        />
      </div>


    </div>
  );
}