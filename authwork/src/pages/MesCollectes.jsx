import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  User,
  Building2,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Cloud,
  Printer,
  FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { useOfflineSync } from '@/components/offline/useOfflineSync';
import BackButton from '@/components/navigation/BackButton';
import PullToRefresh from '@/components/mobile/PullToRefresh';

export default function MesCollectes() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [adminOrg, setAdminOrg] = useState(''); // organisation sélectionnée par l'admin
  const [adminCommune, setAdminCommune] = useState(''); // filtre obligatoire pour admin
  const [filters, setFilters] = useState({ section: '', nature: '', quartier: '', statut: '' });
  const { isOnline, pendingCount } = useOfflineSync();
  const queryClient = useQueryClient();

  // Lire organisation_id depuis l'URL (admin uniquement)
  const urlParams = new URLSearchParams(window.location.search);
  const orgIdFromUrl = urlParams.get('organisation_id');

  // Organisation active pour l'admin (URL ou sélection manuelle) — déclaré tôt pour la query
  const activeOrgId = orgIdFromUrl || adminOrg;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleRefresh = async () => {
    await queryClient.refetchQueries({ queryKey: ['collectes'] });
  };

  const { data: convocations = [] } = useQuery({
    queryKey: ['convocations', user?.organisation_id, adminCommune, activeOrgId],
    queryFn: async () => {
      if (!user) return [];
      const filterObj = {};
      if (activeOrgId) filterObj.organisation_id = activeOrgId;
      if (adminCommune) filterObj.commune = adminCommune;
      else if (user.organisation_id) filterObj.organisation_id = user.organisation_id;
      return await base44.entities.ConvocationParcelle.filter(filterObj, '-created_date', 5000);
    },
    enabled: !!user && (user.role !== 'admin' || (!!activeOrgId && !!adminCommune)),
  });

  const { data: collectes = [], isLoading } = useQuery({
    queryKey: ['collectes', user?.organisation_id, user?.role, adminCommune, activeOrgId],
    queryFn: async () => {
      try {
        if (!user) return [];
        if (user.role === 'admin') {
          const filterObj = {};
          if (activeOrgId) filterObj.organisation_id = activeOrgId;
          if (adminCommune) filterObj.commune = adminCommune;
          return await base44.entities.Collecte.filter(filterObj, '-created_date', 2000);
        }
        if (user.role === 'superviseur') {
          return await base44.entities.Collecte.filter({ organisation_id: user.organisation_id }, '-created_date');
        }
        if (user.organisation_id) {
          return await base44.entities.Collecte.filter({ created_by: user.email }, '-created_date');
        }
        return [];
      } catch (error) {
        console.log('Offline - chargement des collectes depuis le serveur échoué');
        return [];
      }
    },
    enabled: !!user && (user.role !== 'admin' || (!!activeOrgId && !!adminCommune)),
    retry: 1,
    retryDelay: 1000
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list(),
    enabled: user?.role === 'admin'
  });

  const selectedOrg = orgIdFromUrl ? organisations.find(o => o.id === orgIdFromUrl) : null;

  // activeOrgId est déclaré plus haut (avant les queries)
  const activeOrg = organisations.find(o => o.id === activeOrgId);

  // Communes disponibles pour l'admin — uniquement depuis l'org sélectionnée
  const adminCommunesDisponibles = useMemo(() => {
    if (user?.role !== 'admin') return [];
    if (activeOrg) return [...(activeOrg.communes || [])].sort();
    return [];
  }, [user, activeOrg]);

  const communeStats = React.useMemo(() => {
    const communes = new Map();
    collectes?.forEach(c => {
      if (c.commune && typeof c.commune === 'string' && c.commune.trim()) {
        const commune = c.commune.trim().toUpperCase();
        communes.set(commune, (communes.get(commune) || 0) + 1);
      }
    });
    return Array.from(communes, ([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collectes]);

  // Vérifier si l'utilisateur fait partie d'une organisation
  if (!userLoading && user && !user.organisation_id && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Accès refusé</h2>
        <p className="text-slate-600 mb-4">Vous devez être membre d'une organisation</p>
        <Button onClick={() => navigate(createPageUrl('Accueil'))}>Retour à l'accueil</Button>
      </div>
    );
  }

  const getProprietaireName = (collecte) => {
    if (collecte.type_proprietaire === 'societe') {
      return collecte.societe_raison_sociale || '';
    }
    const nom = collecte.prop_nom || '';
    const prenoms = collecte.prop_prenoms || '';
    return [prenoms, nom].filter(Boolean).join(' ');
  };

  const filteredCollectes = collectes.filter(c => {
    const matchSection = !filters.section || c.section === filters.section;
    const matchNature = !filters.nature || c.nature === filters.nature;
    const matchQuartier = !filters.quartier || c.quartier === filters.quartier;
    const matchStatut = !filters.statut || c.statut === filters.statut;

    return matchSection && matchNature && matchQuartier && matchStatut;
  });

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'brouillon':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Brouillon</Badge>;
      case 'validee':
        return <Badge className="bg-green-100 text-green-800">Validée</Badge>;
      case 'complete':
        return <Badge className="bg-amber-100 text-amber-800">Complète</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getAvailableCommunes = () => {
    const filtered = collectes.filter(c => {
      const matchDate = !filters.dateFrom || (c.date_collecte || c.created_date)?.split('T')[0] === filters.dateFrom;
      return matchDate;
    });
    const communes = new Map();
    filtered.forEach(c => {
      if (c.commune && typeof c.commune === 'string' && c.commune.trim()) {
        const commune = c.commune.trim().toUpperCase();
        communes.set(commune, (communes.get(commune) || 0) + 1);
      }
    });
    return Array.from(communes, ([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getAvailableDates = () => {
    const filtered = collectes.filter(c => {
      const matchCommune = filters.communes.length === 0 || filters.communes.includes(c.commune);
      return matchCommune;
    });
    const dates = filtered
      .map(c => c.date_collecte || c.created_date)
      .filter(Boolean)
      .sort()
      .reverse();
    return [...new Set(dates)];
  };

  const getAvailableAgents = () => {
    const filtered = collectes.filter(c => {
      const matchCommune = filters.communes.length === 0 || filters.communes.includes(c.commune);
      const matchDate = !filters.dateFrom || (c.date_collecte || c.created_date)?.split('T')[0] === filters.dateFrom;
      return matchCommune && matchDate;
    });
    const agents = new Map();
    filtered.forEach(c => {
      if (c.signature_agent && typeof c.signature_agent === 'string' && c.signature_agent.trim()) {
        const agent = c.signature_agent.trim();
        agents.set(agent, (agents.get(agent) || 0) + 1);
      }
    });
    return Array.from(agents, ([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getAvailableSections = () => {
    const sections = new Set(collectes.map(c => c.section).filter(Boolean));
    return [...sections].sort();
  };

  const getAvailableNatures = () => {
    const natures = new Set(collectes.map(c => c.nature).filter(Boolean));
    return [...natures].sort();
  };

  const getAvailableQuartiers = () => {
    const quartiers = new Set(collectes.map(c => c.quartier).filter(Boolean));
    return [...quartiers].sort();
  };

  const handlePrint = (collecteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(createPageUrl('DetailCollecte') + `?id=${collecteId}&print=true`, '_blank');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
        {/* Header */}
         <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
           <Button
             onClick={() => navigate(createPageUrl('Accueil'))}
             className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:h-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
           >
             <ChevronLeft className="w-5 h-5 sm:mr-2" />
             <span className="hidden sm:inline">Retour</span>
           </Button>
           <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">
             {selectedOrg ? selectedOrg.nom : 'Mes Collectes'}
           </h1>
           <div className="w-9 sm:w-10"></div>
         </div>
       </div>

      {/* Sélecteurs admin : Organisation puis Commune (obligatoires) */}
      {user?.role === 'admin' && !orgIdFromUrl && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
          <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Organisation <span className="text-red-500">*</span>
              </label>
              <select
                value={adminOrg}
                onChange={e => { setAdminOrg(e.target.value); setAdminCommune(''); setFilters({ section: '', nature: '', quartier: '', statut: '' }); }}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              >
                <option value="">— Sélectionner une organisation —</option>
                {organisations.map(o => (
                  <option key={o.id} value={o.id}>{o.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Commune <span className="text-red-500">*</span>
              </label>
              <select
                value={adminCommune}
                onChange={e => { setAdminCommune(e.target.value); setFilters({ section: '', nature: '', quartier: '', statut: '' }); }}
                disabled={!adminOrg}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 disabled:opacity-50"
              >
                <option value="">— Sélectionner une commune —</option>
                {adminCommunesDisponibles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Si accès via URL avec org_id, juste le sélecteur de commune */}
      {user?.role === 'admin' && orgIdFromUrl && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
              Commune <span className="text-red-500">*</span>
            </label>
            <select
              value={adminCommune}
              onChange={e => { setAdminCommune(e.target.value); setFilters({ section: '', nature: '', quartier: '', statut: '' }); }}
              className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
            >
              <option value="">— Sélectionner une commune —</option>
              {adminCommunesDisponibles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
       <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {user?.role === 'admin' && !(activeOrgId && adminCommune) ? (
          <p className="text-center text-slate-400 italic text-sm py-8">
            Sélectionnez une organisation et une commune pour afficher les collectes.
          </p>
        ) : null}
        {(user?.role !== 'admin' || (activeOrgId && adminCommune)) && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-100 to-blue-200">
                <CardContent className="p-3 sm:p-6 text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-blue-700">{filteredCollectes.length}</p>
                  <p className="text-xs sm:text-sm text-blue-600 mt-1 font-semibold">Total</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-100 to-amber-200">
                <CardContent className="p-3 sm:p-6 text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-amber-700">
                    {filteredCollectes.filter(c => c.statut === 'brouillon').length}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-600 mt-1 font-semibold">Brouillons</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-100 to-green-200">
                <CardContent className="p-3 sm:p-6 text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-green-700">
                    {filteredCollectes.filter(c => c.statut === 'validee').length}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 mt-1 font-semibold">Validées</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-100 to-purple-200">
                <CardContent className="p-3 sm:p-6 text-center">
                  <p className="text-2xl sm:text-4xl font-bold text-purple-700">{convocations.length}</p>
                  <p className="text-xs sm:text-sm text-purple-600 mt-1 font-semibold">Convocations</p>
                </CardContent>
              </Card>
            </div>
            {pendingCount > 0 && (
              <div className="mt-4 flex justify-center">
                <Link to={createPageUrl('SyncOffline')}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    <span>{pendingCount} à synchroniser</span>
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
       </div>

      {/* Filters & List — masqués pour admin sans commune */}
      {(user?.role !== 'admin' || (activeOrgId && adminCommune)) && <>
       <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
         <div className="space-y-3 sm:space-y-4">
           <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
             <div className="flex flex-col">
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quartier</label>
               <Select value={filters.quartier} onValueChange={(value) => setFilters({ ...filters, quartier: value })}>
                 <SelectTrigger className="h-10 text-sm">
                   <SelectValue placeholder="Tous les quartiers" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value={null}>Tous les quartiers</SelectItem>
                   {getAvailableQuartiers().map(quartier => (
                     <SelectItem key={quartier} value={quartier}>{quartier}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="flex flex-col">
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
               <Select value={filters.section} onValueChange={(value) => setFilters({ ...filters, section: value })}>
                 <SelectTrigger className="h-10 text-sm">
                   <SelectValue placeholder="Toutes les sections" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value={null}>Toutes les sections</SelectItem>
                   {getAvailableSections().map(section => (
                     <SelectItem key={section} value={section}>{section}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="flex flex-col">
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nature</label>
               <Select value={filters.nature} onValueChange={(value) => setFilters({ ...filters, nature: value })}>
                 <SelectTrigger className="h-10 text-sm">
                   <SelectValue placeholder="Toutes les natures" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value={null}>Toutes les natures</SelectItem>
                   {getAvailableNatures().map(nature => (
                     <SelectItem key={nature} value={nature}>{nature}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="flex flex-col">
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
               <Select value={filters.statut} onValueChange={(value) => setFilters({ ...filters, statut: value })}>
                 <SelectTrigger className="h-10 text-sm">
                   <SelectValue placeholder="Tous les types" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value={null}>Tous les types</SelectItem>
                   <SelectItem value="brouillon">Brouillon</SelectItem>
                   <SelectItem value="complete">Complète</SelectItem>
                   <SelectItem value="validee">Validée</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>

           {(filters.section || filters.nature || filters.quartier || filters.statut) && (
             <div className="flex justify-start">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setFilters({ section: '', nature: '', quartier: '', statut: '' })}
                 className="text-blue-800 border-blue-800 hover:bg-blue-50"
               >
                 Réinitialiser les filtres
               </Button>
             </div>
           )}
         </div>
         </div>

      {/* List */}
       <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
          </div>
        ) : filteredCollectes.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune collecte</h3>
              <p className="text-slate-500 mb-6">Commencez par créer votre première collecte</p>
              <Link to={createPageUrl('NouvelleCollecte')}>
                <Button className="bg-blue-800 hover:bg-blue-900">
                  <Plus className="w-5 h-5 mr-2" />
                  Créer une collecte
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div>
            {filteredCollectes.slice(0, showAll ? filteredCollectes.length : 3).map((collecte) => (
              <Link
                key={collecte.id}
                to={createPageUrl('DetailCollecte') + `?id=${collecte.id}`}
                className="block mb-2"
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white rounded-lg">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-bold text-xs">
                              {(collecte.commune || 'C')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">
                              {collecte.commune || 'Commune non renseignée'}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-1.5 text-xs text-slate-600 pl-10">
                          <div className="flex items-center gap-1">
                            {collecte.type_proprietaire === 'societe' ? (
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-xs truncate">{getProprietaireName(collecte)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs">
                              {format(new Date(collecte.created_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          {collecte.quartier && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{collecte.quartier}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(collecte.statut)}
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredCollectes.length > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full sm:w-auto border-blue-800 text-blue-800 hover:bg-blue-50"
                >
                  {showAll ? (
                    <>
                      Voir moins
                      <ChevronRight className="w-4 h-4 ml-2 -rotate-90" />
                    </>
                  ) : (
                    <>
                      Voir plus ({filteredCollectes.length - 3} collecte{filteredCollectes.length - 3 > 1 ? 's' : ''})
                      <ChevronRight className="w-4 h-4 ml-2 rotate-90" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      </>}
      </div>
      </PullToRefresh>
      );
      }