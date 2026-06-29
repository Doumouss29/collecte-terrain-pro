import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Save, Send, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineSync } from '@/components/offline/useOfflineSync';
import StepParcelle from '@/components/collecte/StepParcelle';
import StepProprietaire from '@/components/collecte/StepProprietaire';
import StepBien from '@/components/collecte/StepBien';
import StepSynthese from '@/components/collecte/StepSynthese';
import StepGestion from '@/components/collecte/StepGestion';
import StepValidation from '@/components/collecte/StepValidation';
import StepIndicator from '@/components/collecte/StepIndicator';

const STEPS = ['Parcelle', 'Propriétaire', 'Bien', 'Synthèse', 'Gestion', 'Validation'];

export default function CollecteFormDrawer({ isOpen, onClose, parcelleAttrs, user, organisationId, onValidated }) {
  const { isOnline, saveOffline } = useOfflineSync();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedAgentName = localStorage.getItem('agentReviewerName') || '';
  const savedAgentSignature = localStorage.getItem('agentReviewerSignature') || '';

  const [formData, setFormData] = useState({
    statut: 'brouillon',
    type_proprietaire: 'particulier',
    tableau_synthese: [],
    date_collecte: new Date().toISOString().split('T')[0],
    signature_agent: savedAgentName,
    signature_agent_photo: savedAgentSignature,
    organisation_id: organisationId || user?.organisation_id || '',
  });

  // Pré-remplir depuis la parcelle sélectionnée
  useEffect(() => {
    if (parcelleAttrs && isOpen) {
      setCurrentStep(1);
      setCompletedSteps([]);
      setFormData({
        statut: 'brouillon',
        type_proprietaire: 'particulier',
        tableau_synthese: [],
        date_collecte: new Date().toISOString().split('T')[0],
        signature_agent: savedAgentName,
        signature_agent_photo: savedAgentSignature,
        organisation_id: organisationId || user?.organisation_id || '',
        commune: parcelleAttrs.commune || '',
        section: parcelleAttrs.section || '',
        parcelle: parcelleAttrs.parcelle || '',
        quartier: parcelleAttrs.quartier || '',
        lot: parcelleAttrs.lot || '',
        ilot: parcelleAttrs.ilot || '',
      });
    }
  }, [parcelleAttrs, isOpen, organisationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
    // Scroll du drawer en haut
    document.getElementById('collecte-drawer-content')?.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    document.getElementById('collecte-drawer-content')?.scrollTo(0, 0);
  };

  const deleteConvocationIfExists = async (data) => {
    try {
      const orgId = organisationId || data.organisation_id;
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
      const data = { ...formData, organisation_id: organisationId || formData.organisation_id, statut: 'brouillon' };
      if (isOnline) {
        await base44.entities.Collecte.create(data);
        await deleteConvocationIfExists(data);
        toast.success('Brouillon enregistré');
      } else {
        await saveOffline(data);
        toast.success('Brouillon sauvegardé hors ligne');
      }
      onValidated(data);
    } catch (err) {
      toast.error('Erreur: ' + (err?.message || ''));
    }
    setIsSubmitting(false);
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const data = { ...formData, organisation_id: organisationId || formData.organisation_id, statut: 'validee' };
      if (isOnline) {
        await base44.entities.Collecte.create(data);
        await deleteConvocationIfExists(data);
        toast.success('Recensement validé !');
      } else {
        await saveOffline(data);
        toast.success('Sauvegardé hors ligne');
      }
      onValidated(data);
    } catch (err) {
      toast.error('Erreur: ' + (err?.message || ''));
    }
    setIsSubmitting(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepParcelle data={formData} onChange={handleChange} />;
      case 2: return <StepProprietaire data={formData} onChange={handleChange} />;
      case 3: return <StepBien data={formData} onChange={handleChange} />;
      case 4: return <StepSynthese data={formData} onChange={handleChange} />;
      case 5: return <StepGestion data={formData} onChange={handleChange} />;
      case 6: return <StepValidation data={formData} onChange={handleChange} />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay semi-transparent */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer depuis le bas */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh', height: '90vh' }}
      >
        {/* Handle + Header */}
        <div className="flex-shrink-0">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Info parcelle sélectionnée */}
          <div className="px-4 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {parcelleAttrs?.commune} — Section {parcelleAttrs?.section} / Parcelle {parcelleAttrs?.parcelle}
                  </p>
                  {(parcelleAttrs?.quartier || parcelleAttrs?.lot) && (
                    <p className="text-xs text-slate-500">
                      {[parcelleAttrs?.quartier, parcelleAttrs?.lot && `Lot ${parcelleAttrs.lot}`, parcelleAttrs?.ilot && `Îlot ${parcelleAttrs.ilot}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Step indicator compact */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <StepIndicator
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              completedSteps={completedSteps}
            />
          </div>
        </div>

        {/* Contenu scrollable */}
        <div id="collecte-drawer-content" className="flex-1 overflow-y-auto px-3 py-4">
          {renderStep()}
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Précédent</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveDraft}
              disabled={isSubmitting}
              className="text-slate-600"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Brouillon</span>
            </Button>

            {currentStep === 6 ? (
              <Button
                size="sm"
                onClick={submitForm}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="ml-1">Valider</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-blue-800 hover:bg-blue-900 text-white"
              >
                <span className="hidden sm:inline mr-1">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}