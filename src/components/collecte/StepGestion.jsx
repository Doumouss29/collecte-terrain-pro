import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import FormField from './FormField';

export default function StepGestion({ data, onChange }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-t-lg p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
          <Building className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          Gestion du Bien
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="bg-amber-50 border border-amber-200 p-2 sm:p-3 rounded-lg">
          <p className="text-amber-800 text-xs sm:text-sm">
            À remplir uniquement si le bien est géré par une Agence, un huissier ou autre.
          </p>
        </div>

        <FormField
          label="Le bien est-il géré par une agence ou un tiers ?"
          name="gestion_par_agence"
          type="checkbox"
          value={data.gestion_par_agence}
          onChange={onChange}
        />

        {data.gestion_par_agence && (
          <div className="bg-slate-50 p-2 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-slate-800">Informations sur l'Agence / Gestionnaire</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <FormField
                label="Nom ou Raison sociale de l'Agence"
                name="agence_raison_sociale"
                value={data.agence_raison_sociale}
                onChange={onChange}
                className="md:col-span-2"
                uppercase
              />
              <FormField
                label="N° Compte contribuable"
                name="agence_compte_contribuable"
                value={data.agence_compte_contribuable}
                onChange={onChange}
                uppercase
              />
              <FormField
                label="Adresse postale"
                name="agence_adresse_postale"
                value={data.agence_adresse_postale}
                onChange={onChange}
                uppercase
              />
              <FormField
                label="B.P."
                name="agence_bp"
                value={data.agence_bp}
                onChange={onChange}
                uppercase
              />
              <FormField
                label="Ville"
                name="agence_ville"
                value={data.agence_ville}
                onChange={onChange}
                uppercase
              />
              <FormField
                label="Quartier"
                name="agence_quartier"
                value={data.agence_quartier}
                onChange={onChange}
                uppercase
              />
              <FormField
                label="Téléphone"
                name="agence_tel"
                type="tel"
                value={data.agence_tel}
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}