import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { createPageUrl } from '@/utils';

import StepIndicator from '@/components/collecte/StepIndicator';
import StepParcelle from '@/components/collecte/StepParcelle';
import StepProprietaire from '@/components/collecte/StepProprietaire';
import StepBien from '@/components/collecte/StepBien';
import StepSynthese from '@/components/collecte/StepSynthese';
import StepGestion from '@/components/collecte/StepGestion';
import StepValidation from '@/components/collecte/StepValidation';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { useOfflineSync } from '@/components/offline/useOfflineSync';

export default function NouvelleCollecte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOnline, saveOffline, syncCollectes, pendingCount, isSyncing, syncError } = useOfflineSync();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const savedAgentName = localStorage.getItem('agentReviewerName') || '';
  const savedAgentSignature = localStorage.getItem('agentReviewerSignature') || '';
  const selectedOrganisationId = searchParams.get('organisation_id') || '';
  const isFromMapSurvey = searchParams.get('source') === 'carte' || searchParams.has('coordX') || searchParams.has('coordY');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lastCollecte } = useQuery({
    queryKey: ['lastCollecte'],
    queryFn: async () => {
      const collectes = await base44.entities.Collecte.list('-created_date', 1);
      return collectes[0] || {};
    },
  });

  const [formData, setFormData] = useState({
    statut: 'brouillon',
    type_proprietaire: 'particulier',
    tableau_synthese: [],
    date_collecte: new Date().toISOString().split('T')[0],
    signature_agent: savedAgentName,
    signature_agent_photo: savedAgentSignature,
    organisation_id: ''
  });

  // Pré-remplir depuis les paramètres de la carte
  useEffect(() => {
    const parcelData = {
      commune: searchParams.get('commune'),
      section: searchParams.get('section'),
      parcelle: searchParams.get('parcelle'),
      quartier: searchParams.get('quartier'),
      lot: searchParams.get('lot'),
      ilot: searchParams.get('ilot'),
      longitude: searchParams.get('coordX'),
      latitude: searchParams.get('coordY'),
    };

    // Mapper 'surface' sur 'surface_imposable'
    const surface = searchParams.get('surface');
    if (surface) {
      parcelData.surface_imposable = surface;
    }

    // Ne pré-remplir que les champs fournis
    const hasParcelData = Object.values(parcelData).some(v => v !== null);
    if (hasParcelData) {
      setFormData(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(parcelData).filter(([, v]) => v !== null))
      }));
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (lastCollecte) {
      setFormData(prev => ({
        ...prev,
        commune: prev.commune || lastCollecte.commune || '',
        section: prev.section || lastCollecte.section || '',
        quartier: prev.quartier || lastCollecte.quartier || '',
        code_quartier: prev.code_quartier || lastCollecte.code_quartier || '',
        ilot: prev.ilot || lastCollecte.ilot || '',
        prop_pays: prev.prop_pays || lastCollecte.prop_pays || '',
        prop_nationalite: prev.prop_nationalite || lastCollecte.prop_nationalite || ''
      }));
    }
  }, [lastCollecte]);

  React.useEffect(() => {
    const organisationId = user?.role === 'admin' ? selectedOrganisationId : user?.organisation_id;
    if (organisationId) {
      setFormData(prev => ({ ...prev, organisation_id: organisationId }));
    }
  }, [user, selectedOrganisationId]);

  // Vérifier si l'utilisateur fait partie d'une organisation
  if (!userLoading && user && !user.organisation_id && user.role !== 'admin') {
    navigate(createPageUrl('Accueil'));
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    return [];
  };

  const nextStep = () => {
    if (isNavigating) return;
    
    const errors = validateStep();
    if (errors.length > 0) {
      toast.error(`Champs obligatoires manquants: ${errors.join(', ')}`);
      return;
    }

    setIsNavigating(true);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
    window.scrollTo(0, 0);
    setTimeout(() => setIsNavigating(false), 100);
  };

  const prevStep = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
    setTimeout(() => setIsNavigating(false), 100);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const deleteConvocationIfExists = async (data) => {
    try {
      const orgId = data.organisation_id;
      if (!orgId || !data.commune || !data.section || !data.parcelle) return;
      const convocations = await base44.entities.ConvocationParcelle.filter({
        organisation_id: orgId,
        commune: data.commune,
        section: data.section,
        parcelle: data.parcelle,
      });
      for (const conv of convocations) {
        await base44.entities.ConvocationParcelle.delete(conv.id);
      }
    } catch (err) {
      console.error('Erreur suppression convocation:', err);
    }
  };

  const saveDraft = async () => {
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        organisation_id: formData.organisation_id || user?.organisation_id,
        statut: 'brouillon'
      };
      if (isOnline) {
        await base44.entities.Collecte.create(dataToSave);
        await deleteConvocationIfExists(dataToSave);
        toast.success('Brouillon enregistré avec succès');
      } else {
        await saveOffline(dataToSave);
        toast.success('Brouillon sauvegardé hors ligne');
      }
      navigate(createPageUrl('MesCollectes'));
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      toast.error(`Erreur lors de l'enregistrement: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        organisation_id: formData.organisation_id || user?.organisation_id,
        statut: 'validee'
      };
      if (isOnline) {
        await base44.entities.Collecte.create(dataToSave);
        await deleteConvocationIfExists(dataToSave);
        toast.success('Collecte validée avec succès !');
      } else {
        await saveOffline(dataToSave);
        toast.success('Collecte sauvegardée hors ligne - sera synchronisée');
      }
      navigate(createPageUrl('MesCollectes'));
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      toast.error(`Erreur lors de l'enregistrement: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepParcelle data={formData} onChange={handleChange} isFromMap={isFromMapSurvey} />;
      case 2:
        return <StepProprietaire data={formData} onChange={handleChange} />;
      case 3:
        return <StepBien data={formData} onChange={handleChange} />;
      case 4:
        return <StepSynthese data={formData} onChange={handleChange} />;
      case 5:
        return <StepGestion data={formData} onChange={handleChange} />;
      case 6:
        return <StepValidation data={formData} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(createPageUrl('MesCollectes'))}
              className="flex items-center gap-2 bg-blue-800 text-white hover:bg-blue-900 px-3 py-2 rounded-lg border border-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Retour</span>
            </button>
            <h1 className="text-lg font-bold text-slate-800">Nouvelle Collecte</h1>
            <OfflineIndicator
              isOnline={isOnline}
              pendingCount={0}
              isSyncing={false}
              syncError={null}
            />
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <StepIndicator
          currentStep={currentStep}
          onStepClick={goToStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-slate-200 sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isNavigating}
              className="flex items-center gap-2 transition-all duration-150 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={saveDraft}
                disabled={isSubmitting}
                className="text-slate-600 transition-all duration-150 active:scale-95"
              >
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Brouillon</span>
              </Button>

              {currentStep === 6 ? (
                <Button
                  onClick={submitForm}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white transition-all duration-150 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Valider
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isNavigating}
                  className="bg-blue-800 hover:bg-blue-900 text-white transition-all duration-150 active:scale-95"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}