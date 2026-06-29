import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Loader2, Filter } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExportPanel from '@/components/dashboard/ExportPanel';

// Génère toutes les semaines depuis le début des travaux (27 avril 2026)
function getWeekOptions() {
  const options = [];
  const today = new Date();
  const projectStart = new Date('2026-04-27');
  const firstWeekStart = startOfWeek(projectStart, { weekStartsOn: 1 });

  let i = 0;
  while (true) {
    const ref = subWeeks(today, i);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });

    if (start < firstWeekStart) break;

    const label = i === 0
      ? `Semaine en cours (${format(start, 'd MMM', { locale: fr })} – ${format(end, 'd MMM', { locale: fr })})`
      : `${format(start, 'd MMM', { locale: fr })} – ${format(end, 'd MMM', { locale: fr })} (S${format(start, 'w', { locale: fr })})`;
    options.push({
      value: `${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`,
      label,
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
    i++;
  }
  return options;
}

const WEEK_OPTIONS = getWeekOptions();

export default function DashboardSuperviseur() {
  const navigate = useNavigate();
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');


  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organisation } = useQuery({
    queryKey: ['organisation-dash', user?.organisation_id],
    queryFn: () => base44.entities.Organisation.filter({ id: user.organisation_id }).then(r => r[0]),
    enabled: !!user?.organisation_id,
  });

  const { data: cadastres = [] } = useQuery({
    queryKey: ['cadastres-superviseur', user?.organisation_id],
    queryFn: () => base44.entities.CadastreCommunal.filter({ organisation_id: user.organisation_id }),
    enabled: !!user?.organisation_id,
  });

  // Communes disponibles selon le rôle
  const communesDisponibles = useMemo(() => {
    if (!user) return [];
    if (user.role === 'superviseur' && user.communes_supervisees?.length > 0) {
      return user.communes_supervisees;
    }
    return organisation?.communes || [];
  }, [user, organisation]);

  // Semaine sélectionnée décomposée
  const weekParts = selectedWeek ? selectedWeek.split('_') : null;
  const dateDebut = weekParts?.[0] || '';
  const dateFin = weekParts?.[1] || '';

  const filtersReady = !!selectedCommune && !!selectedWeek;
  const communeReady = !!selectedCommune;

  const { data: convocationsRaw = [] } = useQuery({
    queryKey: ['convocations-superviseur', user?.organisation_id, selectedCommune],
    queryFn: () => base44.entities.ConvocationParcelle.filter({ organisation_id: user.organisation_id, commune: selectedCommune, statut: 'active' }, '-created_date', 500),
    enabled: communeReady && !!user?.organisation_id,
    staleTime: 2 * 60 * 1000,
  });

  const convocations = useMemo(() => {
    if (!convocationsRaw.length || !dateDebut || !dateFin) return convocationsRaw;
    const start = new Date(`${dateDebut}T00:00:00`);
    const end = new Date(`${dateFin}T23:59:59`);
    return convocationsRaw.filter(c => {
      const d = c.created_date;
      if (!d) return false;
      return new Date(d) >= start && new Date(d) <= end;
    });
  }, [convocationsRaw, dateDebut, dateFin]);

  // Chargement conditionnel — dès qu'une commune est sélectionnée
  const { data: collectes = [], isLoading: collectesLoading } = useQuery({
    queryKey: ['collectes-superviseur', user?.organisation_id, selectedCommune],
    queryFn: () => base44.entities.Collecte.filter(
      { organisation_id: user.organisation_id, commune: selectedCommune },
      '-date_collecte',
      5000
    ),
    enabled: communeReady && !!user?.organisation_id,
    staleTime: 2 * 60 * 1000,
  });

  // Filtre par semaine côté client — si pas de semaine, retourne toutes les collectes de la commune
  const collectesFiltrees = useMemo(() => {
    if (!collectes.length || !dateDebut || !dateFin) return collectes;
    const start = new Date(`${dateDebut}T00:00:00`);
    const end = new Date(`${dateFin}T23:59:59`);
    return collectes.filter(c => {
      const d = c.date_collecte || c.created_date;
      if (!d) return false;
      const date = new Date(d);
      return date >= start && date <= end;
    });
  }, [collectes, dateDebut, dateFin]);

  const cadastresFiltres = useMemo(() => {
    if (!selectedCommune) return cadastres;
    return cadastres.filter(c => c.commune?.trim().toUpperCase() === selectedCommune.trim().toUpperCase());
  }, [cadastres, selectedCommune]);

  // Stats globales
  const totalCollectes = collectesFiltrees.length;
  const totalValidees = collectesFiltrees.filter(c => c.statut === 'validee').length;
  const totalBrouillons = collectesFiltrees.filter(c => c.statut === 'brouillon').length;

  // Mapping created_by_id → nom agent (depuis les collectes)
  const agentNomParId = useMemo(() => {
    const map = {};
    collectesFiltrees.forEach(c => {
      if (c.created_by_id && c.signature_agent) {
        map[c.created_by_id] = c.signature_agent;
      }
    });
    return map;
  }, [collectesFiltrees]);

  // Convocations par agent (via created_by_id)
  const convocationsParAgentId = useMemo(() => {
    const map = {};
    convocations.forEach(c => {
      const id = c.created_by_id || '__inconnu__';
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [convocations]);

  // Collectes par agent
  const collectesParAgent = useMemo(() => {
    const map = {};
    collectesFiltrees.forEach(c => {
      const agent = c.signature_agent || 'Non renseigné';
      const id = c.created_by_id || agent;
      if (!map[id]) map[id] = { nom: agent, total: 0, validees: 0, brouillons: 0 };
      map[id].total++;
      if (c.statut === 'validee') map[id].validees++;
      if (c.statut === 'brouillon') map[id].brouillons++;
    });
    // Ajouter les convocations
    Object.entries(convocationsParAgentId).forEach(([id, count]) => {
      if (!map[id]) {
        map[id] = { nom: agentNomParId[id] || 'Non renseigné', total: 0, validees: 0, brouillons: 0 };
      }
      map[id].convocations = count;
    });
    // S'assurer que tous ont le champ convocations
    Object.keys(map).forEach(id => {
      if (!map[id].convocations) map[id].convocations = convocationsParAgentId[id] || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [collectesFiltrees, convocationsParAgentId, agentNomParId]);

  const weekLabel = selectedWeek
    ? WEEK_OPTIONS.find(w => w.value === selectedWeek)?.label || ''
    : '';

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (!user || (user.role !== 'superviseur' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Accès refusé</h2>
        <Button onClick={() => navigate(createPageUrl('Accueil'))}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <Button
            onClick={() => navigate(createPageUrl('Accueil'))}
            className="bg-white/95 text-blue-900 hover:bg-white h-10 w-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center shadow-sm flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-tight">DASHBOARD SUPERVISEUR</h1>
          </div>
          <div className="w-10 sm:w-24 flex-shrink-0"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* === FILTRES === */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Filter className="w-4 h-4 text-blue-800" />
              <p className="font-bold text-slate-800 text-sm">Filtres de consultation</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filtre commune */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Commune <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCommune}
                  onChange={e => setSelectedCommune(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                >
                  <option value="">— Sélectionner une commune —</option>
                  {communesDisponibles.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Filtre semaine */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Semaine <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                  disabled={!selectedCommune}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 disabled:opacity-50"
                >
                  <option value="">— Sélectionner une semaine —</option>
                  {WEEK_OPTIONS.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {!filtersReady && (
              <p className="text-xs text-slate-400 italic">
                Sélectionnez une commune et une semaine pour afficher les données.
              </p>
            )}
          </CardContent>
        </Card>

        {/* === RÉSULTATS (dès qu'une commune est sélectionnée) === */}
        {communeReady && (
          <>
            {/* Stats globales */}
            {collectesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-blue-700" />
                <span className="ml-3 text-slate-500 text-sm">Chargement des données…</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-100 to-blue-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-blue-700">{totalCollectes}</p>
                      <p className="text-xs text-blue-600 mt-0.5 font-semibold">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-amber-100 to-amber-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-amber-700">{totalBrouillons}</p>
                      <p className="text-xs text-amber-600 mt-0.5 font-semibold">Brouillons</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-orange-100 to-orange-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-orange-700">{convocations.length}</p>
                      <p className="text-xs text-orange-600 mt-0.5 font-semibold">Convocations</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-100 to-green-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-green-700">{totalValidees}</p>
                      <p className="text-xs text-green-600 mt-0.5 font-semibold">Validées</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tableau par agent */}
                {collectesParAgent.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <p className="font-bold text-slate-800 text-sm mb-3">Collectes par agent</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Agent</th>
                              <th className="text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Total</th>
                              <th className="text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Validées</th>
                              <th className="text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Brouillons</th>
                              <th className="text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Convocations</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collectesParAgent.map((stats, i) => (
                              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="py-2 text-slate-800 font-medium">{stats.nom}</td>
                                <td className="py-2 text-center font-bold text-blue-700">{stats.total}</td>
                                <td className="py-2 text-center font-semibold text-green-600">{stats.validees}</td>
                                <td className="py-2 text-center font-semibold text-amber-600">{stats.brouillons}</td>
                                <td className="py-2 text-center font-semibold text-orange-600">{stats.convocations}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Exports directs */}
                <ExportPanel
                  collectes={collectesFiltrees}
                  commune={selectedCommune}
                  dateLabel={weekLabel || 'Toutes les semaines'}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}