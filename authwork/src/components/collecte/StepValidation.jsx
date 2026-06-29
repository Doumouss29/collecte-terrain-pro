import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, User, Home, Table, Building, Calendar, Pen } from 'lucide-react';
import FormField from './FormField';
import SignaturePad from './SignaturePad';

export default function StepValidation({ data, onChange }) {
  const [showSignaturePad, setShowSignaturePad] = useState(!!data.signature_agent_photo);

  const renderSection = (title, icon, fields) => (
    <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
      <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
        {icon}
        <span className="line-clamp-1">{title}</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
        {fields.map(([label, value]) => (
          value && (
            <div key={label}>
              <span className="text-slate-500 text-xs">{label}:</span>
              <span className="ml-1 font-medium text-slate-800 block text-xs">{value}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );

  const formatBoolean = (val) => val ? 'Oui' : 'Non';
  
  const getNatureLocalLabel = (val) => {
    const map = {
      'immeuble_collectif': 'Immeuble collectif',
      'maison_individuelle': 'Maison individuelle',
      'logement_cour_commune': 'Logement cour commune',
      'local_commercial': 'Local commercial',
      'local_industriel': 'Local industriel',
      'local_artisanal': 'Local artisanal',
      'bureau': 'Bureau'
    };
    return map[val] || val;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-lg p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
          <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="line-clamp-2">Validation et Signature</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="bg-green-50 border border-green-200 p-2 sm:p-3 rounded-lg">
          <p className="text-green-800 text-xs sm:text-sm">
            Vérifiez les informations ci-dessous avant de valider la collecte.
          </p>
        </div>

        {renderSection('Parcelle', <MapPin className="w-4 h-4 text-blue-600" />, [
          ['Commune', data.commune],
          ['Section', data.section],
          ['Parcelle', data.parcelle],
          ['Quartier', data.quartier],
          ['Lot', data.lot],
          ['Îlot', data.ilot],
          ['Surface', data.surface_imposable ? `${data.surface_imposable} m²` : null],
          ['Réf. DGI', data.reference_dgi]
        ])}

        {data.type_proprietaire === 'particulier' ? (
          renderSection('Propriétaire (Particulier)', <User className="w-4 h-4 text-blue-600" />, [
            ['Nom', data.prop_nom],
            ['Prénoms', data.prop_prenoms],
            ['Nationalité', data.prop_nationalite],
            ['Ville', data.prop_ville],
            ['Téléphone', data.prop_tel],
            ['Situation', data.situation_familiale]
          ])
        ) : (
          renderSection('Propriétaire (Société)', <Building className="w-4 h-4 text-blue-600" />, [
            ['Raison sociale', data.societe_raison_sociale],
            ['Registre commerce', data.societe_registre_commerce],
            ['Ville', data.societe_ville],
            ['Téléphone', data.societe_tel]
          ])
        )}

        {renderSection('Bien Immobilier', <Home className="w-4 h-4 text-blue-600" />, [
          ['Nature', getNatureLocalLabel(data.bien_nature_local)],
          ['Eau', formatBoolean(data.bien_equipe_eau)],
          ['Électricité', formatBoolean(data.bien_equipe_electricite)],
          ['Niveaux', data.bien_nombre_niveaux],
          ['Bâtiments', data.bien_nombre_batiments],
          ['Pièces', data.bien_nombre_pieces],
          ['Val. locative', data.bien_valeur_locative_mensuelle ? `${data.bien_valeur_locative_mensuelle} FCFA/mois` : null]
        ])}

        {data.tableau_synthese && data.tableau_synthese.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              Synthèse ({data.tableau_synthese.length} bâtiment{data.tableau_synthese.length > 1 ? 's' : ''})
            </h3>
          </div>
        )}

        {data.gestion_par_agence && (
          renderSection('Gestion par Agence', <Building className="w-4 h-4 text-blue-600" />, [
            ['Agence', data.agence_raison_sociale],
            ['Ville', data.agence_ville],
            ['Téléphone', data.agence_tel]
          ])
        )}

        <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1 sm:gap-2">
            <Pen className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
            Signature de l'Agent Recenseur
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <FormField
              label="Date de la collecte"
              name="date_collecte"
              type="date"
              value={data.date_collecte}
              onChange={onChange}
            />
            <FormField
              label="Nom de l'agent"
              name="signature_agent"
              value={data.signature_agent}
              onChange={onChange}
              placeholder="Nom de l'agent recenseur"
              uppercase
            />
          </div>
          
          <div className="mt-3 sm:mt-4">
            {data.signature_agent_photo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-medium text-sm">Signature de l'agent</label>
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(!showSignaturePad)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showSignaturePad ? 'Valider' : 'Modifier'}
                  </button>
                </div>
                <div className="border-2 border-blue-800 rounded-md bg-white p-3 flex items-center justify-center" style={{height: '120px'}}>
                  <img src={data.signature_agent_photo} alt="Signature" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            ) : (
              <SignaturePad
                label="Signature de l'agent"
                value={data.signature_agent_photo}
                onChange={(signatureUrl) => {
                  onChange({ target: { name: 'signature_agent_photo', value: signatureUrl } });
                }}
                show={true}
                onToggle={() => setShowSignaturePad(!showSignaturePad)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}