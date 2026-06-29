import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Map, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import CadastreMapCollecte from '@/components/cadastre/CadastreMapCollecte';
import CollecteFormDrawer from '@/components/cadastre/CollecteFormDrawer';

function normalizeText(value) {
  return String(value == null ? '' : value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export default function CollecteParCarte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedOrganisationId = searchParams.get('organisation_id') || '';
  const [selectedParcelle, setSelectedParcelle] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [validatedParcelles, setValidatedParcelles] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const handleSectionsLoaded = useCallback(setActiveSections, []);
  const queryClient = useQueryClient();

  // IDs des sections sélectionnées par l'utilisateur
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const effectiveOrganisationId = user?.role === 'admin' ? selectedOrganisationId : user?.organisation_id;

  const { data: organisation } = useQuery({
    queryKey: ['organisation', effectiveOrganisationId],
    queryFn: () => base44.entities.Organisation.filter({ id: effectiveOrganisationId }).then(r => r[0]),
    enabled: !!effectiveOrganisationId,
  });

  const communeOptions = organisation?.communes || [];
  const [selectedCommune, setSelectedCommune] = useState('');

  useEffect(() => {
    setSelectedCommune(communeOptions[0] || '');
  }, [effectiveOrganisationId, communeOptions]);

  // Réinitialiser la sélection de sections au changement de commune
  useEffect(() => {
    setSelectedSectionIds([]);
  }, [selectedCommune]);

  // Charger les métadonnées de toutes les sections de la commune (pas les GeoJSON)
  const { data: allCadastreSections = [] } = useQuery({
    queryKey: ['cadastre-meta', effectiveOrganisationId, selectedCommune],
    queryFn: async () => {
      const all = await base44.entities.CadastreCommunal.filter(
        { organisation_id: effectiveOrganisationId },
        '-created_date',
        1000
      );
      return all.filter((s) => normalizeText(s.commune) === normalizeText(selectedCommune));
    },
    enabled: !!effectiveOrganisationId && !!selectedCommune,
    staleTime: 5 * 60 * 1000,
  });

  // Sections sélectionnées avec leurs métadonnées complètes
  const selectedSections = allCadastreSections.filter((s) => selectedSectionIds.includes(s.id));

  // Charger les collectes déjà faites pour marquer les parcelles
  const { data: collectesExistantes = [] } = useQuery({
    queryKey: ['collectes-carte', effectiveOrganisationId, selectedCommune],
    queryFn: async () => {
      const all = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const batch = await base44.entities.Collecte.filter(
          { organisation_id: effectiveOrganisationId, commune: selectedCommune },
          '-created_date',
          pageSize,
          page * pageSize
        );
        all.push(...batch);
        if (batch.length < pageSize) break;
        page++;
        if (page > 20) break;
      }
      return all;
    },
    enabled: !!effectiveOrganisationId && !!selectedCommune,
  });

  const { data: convocations = [] } = useQuery({
    queryKey: ['convocations-carte', effectiveOrganisationId, selectedCommune],
    queryFn: () => base44.entities.ConvocationParcelle.filter(
      { organisation_id: effectiveOrganisationId, commune: selectedCommune, statut: 'active' },
      '-created_date',
      5000
    ),
    enabled: !!effectiveOrganisationId && !!selectedCommune,
  });

  const handleParcelleClick = (attrs) => {
    setSelectedParcelle(attrs);
    setIsFormOpen(true);
  };

  const handleLeaveConvocation = async (parcelleAttrs) => {
    await base44.entities.ConvocationParcelle.create({
      organisation_id: effectiveOrganisationId,
      commune: parcelleAttrs.commune,
      section: parcelleAttrs.section,
      parcelle: parcelleAttrs.parcelle,
      lot: parcelleAttrs.lot,
      ilot: parcelleAttrs.ilot,
      quartier: parcelleAttrs.quartier,
      coordX: parcelleAttrs.coordX ? String(parcelleAttrs.coordX) : '',
      coordY: parcelleAttrs.coordY ? String(parcelleAttrs.coordY) : '',
      surface: parcelleAttrs.surface,
      statut: 'active'
    });
    queryClient.invalidateQueries({ queryKey: ['convocations-carte', effectiveOrganisationId] });
    toast.success('Convocation enregistrée');
  };

  const handleCollecteValidated = () => {
    setValidatedParcelles(prev => [...prev, { ...selectedParcelle, collecteId: Date.now() }]);
    queryClient.invalidateQueries({ queryKey: ['collectes-carte', effectiveOrganisationId, selectedCommune] });
    queryClient.invalidateQueries({ queryKey: ['convocations-carte', effectiveOrganisationId] });
    setIsFormOpen(false);
    setSelectedParcelle(null);
    toast.success('Recensement enregistré !');
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedParcelle(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.organisation_id && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <p className="text-slate-700 text-center">Vous devez appartenir à une organisation.</p>
        <Button className="mt-4" onClick={() => navigate(createPageUrl('Accueil'))}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header compact */}
      <div className="bg-blue-900 text-white px-3 py-2 flex items-center gap-3 flex-shrink-0">
        <Button
          size="sm"
          onClick={() => navigate(createPageUrl('Accueil'))}
          className="bg-white/20 hover:bg-white/30 text-white h-8 px-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Map className="w-4 h-4 text-blue-300" />
          <span className="font-bold text-sm">Recensement par carte</span>
        </div>
        {/* Sélecteur de commune */}
        {communeOptions.length > 1 && (
          <select
            className="bg-white/20 text-white text-xs rounded px-2 py-1 border border-white/30"
            value={selectedCommune}
            onChange={e => setSelectedCommune(e.target.value)}
          >
            {communeOptions.map(c => (
              <option key={c} value={c} className="text-slate-900">{c}</option>
            ))}
          </select>
        )}
        {communeOptions.length === 1 && (
          <span className="text-blue-200 text-xs font-medium">{selectedCommune}</span>
        )}
      </div>

      {/* Carte plein écran */}
      <div className="flex-1 relative">
        {selectedCommune && effectiveOrganisationId ? (
          <>
            <CadastreMapCollecte
              commune={selectedCommune}
              organisationId={effectiveOrganisationId}
              collectesExistantes={collectesExistantes}
              convocations={convocations}
              validatedParcelles={validatedParcelles}
              onParcelleClick={handleParcelleClick}
              onLeaveConvocation={handleLeaveConvocation}
              onSectionsLoaded={handleSectionsLoaded}
              isAdmin={user?.role === 'admin'}
              selectedSections={selectedSections}
              userId={user?.id}
              selectedSectionIds={selectedSectionIds}
              onSectionSelectionChange={setSelectedSectionIds}
              allCadastreSections={allCadastreSections}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Map className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>Aucune commune configurée</p>
              <p className="text-sm mt-1">Configurez les communes dans les paramètres de l'organisation</p>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire de collecte en drawer */}
      <CollecteFormDrawer
        isOpen={isFormOpen}
        onClose={handleFormClose}
        parcelleAttrs={selectedParcelle}
        user={user}
        organisationId={effectiveOrganisationId}
        onValidated={handleCollecteValidated}
      />
    </div>
  );
}