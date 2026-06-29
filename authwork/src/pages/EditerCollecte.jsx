import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import BackButton from '@/components/navigation/BackButton';


import StepIndicator from '@/components/collecte/StepIndicator';
import StepParcelle from '@/components/collecte/StepParcelle';
import StepProprietaire from '@/components/collecte/StepProprietaire';
import StepBien from '@/components/collecte/StepBien';
import StepSynthese from '@/components/collecte/StepSynthese';
import StepGestion from '@/components/collecte/StepGestion';
import StepValidation from '@/components/collecte/StepValidation';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { useOfflineSync } from '@/components/offline/useOfflineSync';

export default function EditerCollecte() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const collecteId = urlParams.get('id');
  const { isOnline, pendingCount, syncCollectes, updateOffline } = useOfflineSync();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);

  const { data: collecte, isLoading } = useQuery({
    queryKey: ['collecte', collecteId],
    queryFn: async () => {
      const results = await base44.entities.Collecte.filter({ id: collecteId });
      return results[0];
    },
    enabled: !!collecteId
  });

  useEffect(() => {
    if (collecte) {
      setFormData(collecte);
    }
  }, [collecte]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    try {
      const { id, created_date, updated_date, created_by, ...dataToUpdate } = formData;
      if (isOnline) {
        await base44.entities.Collecte.update(collecteId, dataToUpdate);
        toast.success('Modifications enregistrées');
      } else {
        await updateOffline(collecteId, dataToUpdate);
        toast.success('Modifications sauvegardées hors ligne');
      }
      navigate(createPageUrl('DetailCollecte') + `?id=${collecteId}`);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForm = async () => {
    if (!formData.commune) {
      toast.error('Veuillez renseigner la commune');
      return;
    }
    if (!formData.date_collecte || !formData.signature_agent) {
      toast.error('Veuillez signer et dater la collecte');
      return;
    }

    setIsSubmitting(true);
    try {
      const { id, created_date, updated_date, created_by, ...dataToUpdate } = formData;
      if (isOnline) {
        await base44.entities.Collecte.update(collecteId, {
          ...dataToUpdate,
          statut: 'validee'
        });
        toast.success('Collecte validée avec succès !');
      } else {
        await updateOffline(collecteId, {
          ...dataToUpdate,
          statut: 'validee'
        });
        toast.success('Collecte sauvegardée hors ligne - sera synchronisée');
      }
      navigate(createPageUrl('DetailCollecte') + `?id=${collecteId}`);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (!formData) return null;
    switch (currentStep) {
      case 1:
        return <StepParcelle data={formData} onChange={handleChange} />;
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

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingCount}
        onSync={syncCollectes}
      />
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(createPageUrl('DetailCollecte') + `?id=${collecteId}`)}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Retour</span>
            </button>
            <h1 className="text-lg font-bold text-slate-800">Modifier la Collecte</h1>
            <div className="w-20" />
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
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                onClick={saveChanges}
                disabled={isSubmitting}
                className="text-slate-600"
              >
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Enregistrer</span>
              </Button>

              {currentStep === 6 ? (
                <Button
                  onClick={submitForm}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
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
                  className="bg-blue-800 hover:bg-blue-900 text-white"
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