import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormField from './FormField';
import PhotoIdUpload from './PhotoIdUpload';
import SignaturePad from './SignaturePad';
import { useLastEnteredValues } from './useLastEnteredValues';

export default function StepProprietaire({ data, onChange }) {
  const { getLastValues } = useLastEnteredValues();
  const lastValues = getLastValues();
  const [showSignaturePad, setShowSignaturePad] = useState(!data.prop_photo_signature);



  // Initialize signature state based on existing data
  useEffect(() => {
    setShowSignaturePad(!data.prop_photo_signature);
  }, [data.prop_photo_signature]);

  // Auto-fill signature name and date based on owner type
  useEffect(() => {
    let newSignature = '';
    
    if (data.type_proprietaire === 'particulier') {
      newSignature = `${data.prop_prenoms || ''} ${data.prop_nom || ''}`.trim();
    } else if (data.type_proprietaire === 'societe') {
      newSignature = data.societe_raison_sociale || '';
    }
    
    if (newSignature && newSignature !== data.prop_signature && typeof onChange === 'function') {
      onChange({ target: { name: 'prop_signature', value: newSignature } });
    }
  }, [data.prop_prenoms, data.prop_nom, data.societe_raison_sociale, data.type_proprietaire]);

  // Auto-fill societe signature fields
  useEffect(() => {
    if (data.type_proprietaire === 'societe') {
      // Auto-fill societe_signature if empty
      if (!data.societe_signature && data.societe_raison_sociale) {
        onChange({ target: { name: 'societe_signature', value: data.societe_raison_sociale } });
      }
      
      // Auto-fill societe_signature_date with today if empty
      if (!data.societe_signature_date) {
        const today = new Date().toISOString().split('T')[0];
        onChange({ target: { name: 'societe_signature_date', value: today } });
      }
    }
  }, [data.type_proprietaire, data.societe_raison_sociale, data.societe_signature, data.societe_signature_date]);

  const situationOptions = [
    { value: 'celibataire', label: 'CÉLIBATAIRE' },
    { value: 'marie', label: 'MARIÉ(E)' },
    { value: 'divorce', label: 'DIVORCÉ(E)' },
    { value: 'veuf', label: 'VEUF(VE)' }
  ];



  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-t-lg p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
          <User className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="line-clamp-2">Renseignements sur le Propriétaire</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <Tabs 
          value={data.type_proprietaire || 'particulier'} 
          onValueChange={(value) => onChange({ target: { name: 'type_proprietaire', value } })}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 gap-1">
            <TabsTrigger value="particulier" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white text-xs sm:text-sm py-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Particulier</span>
              <span className="sm:hidden">Perso</span>
            </TabsTrigger>
            <TabsTrigger value="societe" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white text-xs sm:text-sm py-2">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Société</span>
              <span className="sm:hidden">Soc.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="particulier" className="space-y-3 sm:space-y-4">
            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Identité du propriétaire</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <FormField
                  label="Nom"
                  name="prop_nom"
                  value={data.prop_nom}
                  onChange={onChange}
                  placeholder="Nom"
                  uppercase
                />
                <FormField
                  label="Prénoms"
                  name="prop_prenoms"
                  value={data.prop_prenoms}
                  onChange={onChange}
                  placeholder="Prénoms"
                  uppercase
                />
                <FormField
                  label="Date de naissance"
                  name="prop_date_naissance"
                  type="date"
                  value={data.prop_date_naissance}
                  onChange={onChange}
                />
                <FormField
                  label="Lieu de naissance"
                  name="prop_lieu_naissance"
                  value={data.prop_lieu_naissance}
                  onChange={onChange}
                  placeholder="Lieu de naissance"
                  uppercase
                />
                <FormField
                  label="Sous-Préfecture"
                  name="prop_sous_prefecture"
                  value={data.prop_sous_prefecture}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                   label="Pays"
                   name="prop_pays"
                   value={data.prop_pays ?? ''}
                   onChange={onChange}
                   uppercase
                 />
                <FormField
                   label="N° Carte d'identité"
                   name="prop_carte_identite"
                   value={data.prop_carte_identite}
                   onChange={onChange}
                   uppercase
                 />
                 <FormField
                    label="Nationalité"
                    name="prop_nationalite"
                    value={data.prop_nationalite ?? ''}
                    onChange={onChange}
                    uppercase
                  />
                </div>
                <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <PhotoIdUpload 
                    label="Recto" 
                    fieldName="prop_photo_carte_identite_recto" 
                    photoValue={data.prop_photo_carte_identite_recto}
                    onChange={onChange}
                  />
                  <PhotoIdUpload 
                    label="Verso" 
                    fieldName="prop_photo_carte_identite_verso" 
                    photoValue={data.prop_photo_carte_identite_verso}
                    onChange={onChange}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                <FormField
                  label="Autre pièce (préciser)"
                  name="prop_autre_piece"
                  value={data.prop_autre_piece}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="N° autre pièce"
                  name="prop_autre_piece_numero"
                  value={data.prop_autre_piece_numero}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="N° Compte contribuable"
                  name="prop_compte_contribuable"
                  value={data.prop_compte_contribuable}
                  onChange={onChange}
                  uppercase
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                <FormField
                  label="Nom et Prénoms du Père"
                  name="prop_nom_pere"
                  value={data.prop_nom_pere}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Nom et Prénoms de la Mère"
                  name="prop_nom_mere"
                  value={data.prop_nom_mere}
                  onChange={onChange}
                  uppercase
                />
              </div>
            </div>

            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Adresse de résidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <FormField
                  label="Adresse postale"
                  name="prop_adresse_postale"
                  value={data.prop_adresse_postale}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="B.P."
                  name="prop_bp"
                  value={data.prop_bp}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Ville"
                  name="prop_ville"
                  value={data.prop_ville}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Quartier"
                  name="prop_quartier_residence"
                  value={data.prop_quartier_residence}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Téléphone"
                  name="prop_tel"
                  type="tel"
                  value={data.prop_tel}
                  onChange={onChange}
                />
                <FormField
                  label="T.F."
                  name="prop_adresse_tf"
                  value={data.prop_adresse_tf}
                  onChange={onChange}
                  uppercase
                />
              </div>
              <div className="mt-2 sm:mt-3">
                <FormField
                  label="Informations complémentaires"
                  name="prop_infos_complementaires"
                  type="textarea"
                  value={data.prop_infos_complementaires}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Situation de famille</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <FormField
                  label="Situation familiale"
                  name="situation_familiale"
                  type="select"
                  value={data.situation_familiale}
                  onChange={onChange}
                  options={situationOptions}
                />
                <FormField
                  label="Nombre d'enfants à charge"
                  name="nombre_enfants"
                  type="number"
                  value={data.nombre_enfants}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Adresse professionnelle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <FormField
                  label="Profession"
                  name="prof_profession"
                  value={data.prof_profession}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Service / Employeur"
                  name="prof_service_employeur"
                  value={data.prof_service_employeur}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Adresse postale"
                  name="prof_adresse_postale"
                  value={data.prof_adresse_postale}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="B.P."
                  name="prof_bp"
                  value={data.prof_bp}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Ville"
                  name="prof_ville"
                  value={data.prof_ville}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Quartier"
                  name="prof_quartier"
                  value={data.prof_quartier}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Téléphone"
                  name="prof_tel"
                  type="tel"
                  value={data.prof_tel}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Section Signature */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-800 p-3 sm:p-6 rounded-lg mt-4 sm:mt-6">
              <h3 className="font-bold text-xs sm:text-sm text-blue-900 mb-3 sm:mb-4 pb-2 border-b-2 border-blue-800">Attestation du propriétaire</h3>
              <div className="text-xs sm:text-sm text-slate-700 mb-4 p-2 sm:p-3 bg-white rounded border border-blue-200">
                <p className="mb-2">Je certifie sur l'honneur que les informations ci-dessus sont véritables et exactes.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <FormField
                    label="Date"
                    name="prop_signature_date"
                    type="date"
                    value={data.prop_signature_date}
                    onChange={onChange}
                  />
                  <FormField
                    label="Nom et prénoms"
                    name="prop_signature"
                    value={data.prop_signature}
                    onChange={onChange}
                    placeholder="Nom et prénoms"
                    uppercase
                  />
                </div>
                <div>
                  <SignaturePad
                    label="Signature"
                    value={data.prop_photo_signature}
                    onChange={(signatureData) => {
                      onChange({ target: { name: 'prop_photo_signature', value: signatureData } });
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="societe" className="space-y-3 sm:space-y-4">
            <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Informations sur la société</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <FormField
                  label="Nom ou Raison sociale"
                  name="societe_raison_sociale"
                  value={data.societe_raison_sociale}
                  onChange={onChange}
                  placeholder="Nom"
                  className="md:col-span-2"
                  uppercase
                />
                <FormField
                  label="N° Registre de Commerce"
                  name="societe_registre_commerce"
                  value={data.societe_registre_commerce}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="N° Compte contribuable"
                  name="societe_compte_contribuable"
                  value={data.societe_compte_contribuable}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Adresse postale"
                  name="societe_adresse_postale"
                  value={data.societe_adresse_postale}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="B.P."
                  name="societe_bp"
                  value={data.societe_bp}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Ville"
                  name="societe_ville"
                  value={data.societe_ville}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Quartier"
                  name="societe_quartier"
                  value={data.societe_quartier}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Téléphone"
                  name="societe_tel"
                  type="tel"
                  value={data.societe_tel}
                  onChange={onChange}
                />
                <FormField
                  label="Îlot"
                  name="societe_ilot"
                  value={data.societe_ilot}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="Lot"
                  name="societe_lot"
                  value={data.societe_lot}
                  onChange={onChange}
                  uppercase
                />
                <FormField
                  label="T.F."
                  name="societe_tf"
                  value={data.societe_tf}
                  onChange={onChange}
                  uppercase
                />
              </div>
              </div>

              {/* Section Signature */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-800 p-3 sm:p-6 rounded-lg mt-4 sm:mt-6">
              <h3 className="font-bold text-xs sm:text-sm text-blue-900 mb-3 sm:mb-4 pb-2 border-b-2 border-blue-800">Attestation du représentant de la société</h3>
              <div className="text-xs sm:text-sm text-slate-700 mb-4 p-2 sm:p-3 bg-white rounded border border-blue-200">
                <p className="mb-2">Je certifie sur l'honneur que les informations ci-dessus sont véritables et exactes.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <FormField
                    label="Date"
                    name="societe_signature_date"
                    type="date"
                    value={data.societe_signature_date}
                    onChange={onChange}
                  />
                  <FormField
                     label="Nom et prénoms du représentant"
                     name="societe_signature"
                     value={data.societe_signature}
                     onChange={onChange}
                     placeholder="Nom et prénoms"
                     uppercase
                   />
                </div>
                <div>
                  <SignaturePad
                    label="Signature"
                    value={data.societe_photo_signature}
                    onChange={(signatureData) => {
                      onChange({ target: { name: 'societe_photo_signature', value: signatureData } });
                    }}
                  />
                </div>
              </div>
              </div>
              </TabsContent>
              </Tabs>
              </CardContent>
              </Card>
              );
              }