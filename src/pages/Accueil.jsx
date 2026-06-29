import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import OrgSelectorModal from '@/components/admin/OrgSelectorModal';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Archive, LogOut, FileText, Building2, Building2 as Building2Icon, ChevronDown, Settings, MoreVertical, BarChart3, Map } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import AgentNameModal from '@/components/collecte/AgentNameModal';

export default function Accueil() {
  const navigate = useNavigate();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [orgModalTarget, setOrgModalTarget] = useState(null);

  const handleAdminNav = (target) => {
    setOrgModalTarget(target);
  };

  const handleOrgSelected = (org) => {
    const param = `?organisation_id=${org.id}`;
    if (orgModalTarget === 'archive') navigate(createPageUrl('MesCollectes') + param);
    else if (orgModalTarget === 'rapportCompact') navigate(createPageUrl('RapportCollecteCompact') + param);
    else if (orgModalTarget === 'rapportDetaille') navigate(createPageUrl('RapportCollecte') + param);
    else if (orgModalTarget === 'collecteParCarte') navigate(createPageUrl('CollecteParCarte') + param);
    else if (orgModalTarget === 'dashboardSuperviseur') navigate(createPageUrl('DashboardSuperviseur') + param);
    setOrgModalTarget(null);
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleNewCollecte = () => {
    const savedAgent = localStorage.getItem('agentReviewerName');
    const savedSignature = localStorage.getItem('agentReviewerSignature');
    if (!savedAgent || !savedSignature) {
      setIsAgentModalOpen(true);
    } else {
      navigate(createPageUrl('NouvelleCollecte'));
    }
  };

  const handleAgentNameSubmit = (agentName, agentSignature) => {
    navigate(createPageUrl('NouvelleCollecte'));
  };

  // Vérifier et traiter les invitations en attente
  React.useEffect(() => {
    const checkInvitations = async () => {
      if (user && !user.organisation_id && user.role !== 'admin') {
        try {
          const invitations = await base44.entities.Invitation.filter({ email: user.email, statut: 'en_attente' });
          if (invitations.length > 0) {
            const invitation = invitations[0];
            await base44.auth.updateMe({ organisation_id: invitation.organisation_id });
            await base44.entities.Invitation.update(invitation.id, { statut: 'acceptee' });
            window.location.reload();
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des invitations:', error);
        }
      }
    };
    if (user) {
      checkInvitations();
    }
  }, [user]);

  // Vérifier si l'utilisateur fait partie d'une organisation
  if (!userLoading && user && !user.organisation_id && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex flex-col items-center justify-center px-4 py-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Accès en attente</h2>
          <p className="text-slate-600 mb-4">
            Vous devez être membre d'une organisation pour accéder à l'application.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Veuillez contacter votre administrateur pour être ajouté à une organisation.
          </p>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex flex-col">

      {/* Header */}
      <div className="w-full bg-blue-900/60 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69763698f133e8ecb1784749/277caf724_android-chrome-192x192.png"
            alt="Logo LM-Collecte"
            className="h-12 w-12 rounded-xl shadow-md"
          />
          <span className="text-white font-bold text-base tracking-widest">LM-COLLECTE</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-white hover:opacity-80 transition-opacity">
              <MoreVertical className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('About')} className="flex items-center cursor-pointer">
                <FileText className="w-4 h-4 mr-3" />
                <span>À propos</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('Settings')} className="flex items-center cursor-pointer">
                <Settings className="w-4 h-4 mr-3" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="w-4 h-4 mr-3" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bandeau titre sous le header */}
      <div className="w-full bg-white/10 border-b border-white/10 px-3 py-2 sm:py-4 text-center">
       <h2 className="inline-block bg-white text-blue-900 text-xs sm:text-base font-bold leading-tight tracking-widest uppercase px-3 py-0.5 sm:py-1 rounded-full">
         PROJET E-CADASTRE
       </h2>
       <p className="text-white text-sm sm:text-lg font-semibold mt-1.5 sm:mt-3">
         OPÉRATION DE RECENSEMENT DES PROPRIÉTAIRES FONCIERS
       </p>
      </div>

      {/* Contenu principal - tuiles */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 sm:py-8">
      <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl text-center">

        {/* Boutons de navigation en tuiles */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">

          {/* LIGNE 1 (A) : Nouvelle Collecte + Recensement par Carte */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <button
              onClick={handleNewCollecte}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl"
            >
              <Plus className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
              <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Nouvelle Collecte</span>
            </button>
            <button onClick={() => user?.role === 'admin' ? handleAdminNav('collecteParCarte') : navigate(createPageUrl('CollecteParCarte'))} className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl">
              <Map className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
              <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Recensement par Carte</span>
            </button>
          </div>

          {/* LIGNE 2 (B) : Archive, Rapport Compact, Rapport Détaillé */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Archive */}
            {user?.role === 'admin' ? (
              <button
                onClick={() => handleAdminNav('archive')}
                className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 border-2 border-white/50 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl"
              >
                <Archive className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
                <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Archive</span>
              </button>
            ) : (
              <Link to={createPageUrl('MesCollectes')} className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 border-2 border-white/50 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl">
                <Archive className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
                <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Archive</span>
              </Link>
            )}

            {/* Rapport Compact */}
            <button
              onClick={() => user?.role === 'admin' ? handleAdminNav('rapportCompact') : navigate(createPageUrl('RapportCollecteCompact'))}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-green-500 hover:bg-green-400 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl"
            >
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
              <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Rapport Compact</span>
            </button>

            {/* Rapport Détaillé */}
            <button
              onClick={() => user?.role === 'admin' ? handleAdminNav('rapportDetaille') : navigate(createPageUrl('RapportCollecte'))}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl"
            >
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
              <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Rapport Détaillé</span>
            </button>
          </div>

          {/* Dashboard Superviseur (role superviseur) */}
          {user?.role === 'superviseur' && (
            <Link to={createPageUrl('DashboardSuperviseur')} className="w-full flex flex-col items-center justify-center gap-2 sm:gap-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-[1.02] hover:shadow-2xl">
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
              <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Tableau de bord superviseur</span>
            </Link>
          )}

          {/* Admin : Superviseur + Organisations */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <button onClick={() => handleAdminNav('dashboardSuperviseur')} className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
                <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Superviseur</span>
              </button>
              <Link to={createPageUrl('AdminOrganisations')} className="flex flex-col items-center justify-center gap-2 sm:gap-3 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-10 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-2xl">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14" />
                <span className="text-xs sm:text-base lg:text-lg font-bold text-center leading-tight">Organisation</span>
              </Link>
            </div>
          )}
        </div>

        <AgentNameModal 
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
          onSubmit={handleAgentNameSubmit}
        />
        <OrgSelectorModal
          isOpen={!!orgModalTarget}
          onClose={() => setOrgModalTarget(null)}
          onSelect={handleOrgSelected}
          title={
            orgModalTarget === 'archive' ? "Organisation — Archive" :
            orgModalTarget === 'rapportCompact' ? "Organisation — Rapport Compact" :
            orgModalTarget === 'rapportDetaille' ? "Organisation — Rapport Détaillé" :
            orgModalTarget === 'collecteParCarte' ? "Organisation — Recensement par Carte" :
            orgModalTarget === 'dashboardSuperviseur' ? "Organisation — Superviseur" :
            "Organisation"
          }
        />
      </div>
      </div>
      </div>
  );
}