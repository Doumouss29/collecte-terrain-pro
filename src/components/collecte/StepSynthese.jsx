import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Plus, Trash2 } from 'lucide-react';
import FormField from './FormField';

export default function StepSynthese({ data, onChange }) {
  const tableauSynthese = data.tableau_synthese || [];

  // Synchroniser automatiquement les détails supplémentaires avec le tableau de synthèse
  React.useEffect(() => {
    const hasDetails = data.bien_annee_achevement || data.bien_nature_occupation || 
                       data.bien_valeur_locative_mensuelle || data.bien_nombre_pieces;
    
    if (hasDetails) {
      if (tableauSynthese.length === 0) {
        // Créer automatiquement une première ligne avec les détails
        const valeurLocativeAnnuelle = data.bien_valeur_locative_mensuelle ? data.bien_valeur_locative_mensuelle * 12 : '';
        const newTableau = [{
          annee_achevement: data.bien_annee_achevement || '',
          nature_occupation: data.bien_nature_occupation || '',
          valeur_locative_annuelle: valeurLocativeAnnuelle,
          nombre_pieces: data.bien_nombre_pieces || ''
        }];
        onChange({ target: { name: 'tableau_synthese', value: newTableau } });
      } else {
        // Mettre à jour la première ligne existante
        const premierBatiment = tableauSynthese[0];
        const valeurLocativeAnnuelle = data.bien_valeur_locative_mensuelle ? data.bien_valeur_locative_mensuelle * 12 : premierBatiment.valeur_locative_annuelle;
        
        const needsUpdate = 
          premierBatiment.annee_achevement !== (data.bien_annee_achevement || '') ||
          premierBatiment.nature_occupation !== (data.bien_nature_occupation || '') ||
          premierBatiment.valeur_locative_annuelle !== valeurLocativeAnnuelle ||
          premierBatiment.nombre_pieces !== (data.bien_nombre_pieces || '');
        
        if (needsUpdate) {
          const newTableau = [...tableauSynthese];
          newTableau[0] = {
            annee_achevement: data.bien_annee_achevement || premierBatiment.annee_achevement,
            nature_occupation: data.bien_nature_occupation || premierBatiment.nature_occupation,
            valeur_locative_annuelle: valeurLocativeAnnuelle,
            nombre_pieces: data.bien_nombre_pieces || premierBatiment.nombre_pieces
          };
          onChange({ target: { name: 'tableau_synthese', value: newTableau } });
        }
      }
    }
  }, [data.bien_annee_achevement, data.bien_nature_occupation, data.bien_valeur_locative_mensuelle, data.bien_nombre_pieces]);

  const addRow = () => {
    const newTableau = [
      ...tableauSynthese,
      {
        annee_achevement: '',
        nature_occupation: '',
        valeur_locative_annuelle: '',
        nombre_pieces: ''
      }
    ];
    onChange({ target: { name: 'tableau_synthese', value: newTableau } });
  };

  const removeRow = (index) => {
    const newTableau = tableauSynthese.filter((_, i) => i !== index);
    onChange({ target: { name: 'tableau_synthese', value: newTableau } });
  };

  const updateRow = (index, field, value) => {
    const newTableau = tableauSynthese.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    onChange({ target: { name: 'tableau_synthese', value: newTableau } });
  };

  const natureOccupationOptions = [
    { value: 'proprietaire', label: '1 - LOCAL OCCUPÉ PAR LE PROPRIÉTAIRE' },
    { value: 'usine', label: '2 - USINE' },
    { value: 'local_commercial', label: '5 - LOCAL COMMERCIAL' },
    { value: 'local_professionnel', label: '6 - LOCAL PROFESSIONNEL OU ATELIER' },
    { value: 'entrepot', label: '7 - ENTREPÔT' },
    { value: 'habitation_louee', label: '8 - HABITATION LOUÉE' },
    { value: 'inoccupe', label: '0 - LOCAL INOCCUPÉ' }
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-t-lg p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
          <Table className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          <span>Tableau de Synthèse</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
          Ajoutez une ligne pour chaque bâtiment ou unité du bien immobilier.
        </p>

        <div className="space-y-2 sm:space-y-3">
          {tableauSynthese.map((row, index) => (
            <div
              key={index}
              className="bg-slate-50 p-2 sm:p-4 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="font-bold text-xs sm:text-sm text-slate-700">Bâtiment {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <FormField
                    label="Année achèvement"
                    name={`annee_${index}`}
                    value={row.annee_achevement}
                    onChange={(e) => updateRow(index, 'annee_achevement', e.target.value)}
                    placeholder="AAAA"
                    uppercase
                  />
                <FormField
                  label="Nature d'occupation"
                  name={`nature_${index}`}
                  type="select"
                  value={row.nature_occupation || ''}
                  onChange={(e) => updateRow(index, 'nature_occupation', e.target.value)}
                  options={natureOccupationOptions}
                />
                <FormField
                   label="Valeur locative annuelle"
                   name={`valeur_${index}`}
                   type="text"
                   value={row.valeur_locative_annuelle ? `${row.valeur_locative_annuelle.toLocaleString('fr-FR')} FCFA` : ''}
                   onChange={(e) => {
                     const numValue = e.target.value.replace(/\s|FCFA/g, '').replace(/,/g, '');
                     updateRow(index, 'valeur_locative_annuelle', numValue ? parseInt(numValue) : '');
                   }}
                   placeholder="FCFA"
                 />
                <FormField
                  label="Nombre de pièces"
                  name={`pieces_${index}`}
                  type="number"
                  value={row.nombre_pieces}
                  onChange={(e) => updateRow(index, 'nombre_pieces', e.target.value)}
                />
              </div>
            </div>
          ))}

          <Button
            onClick={addRow}
            variant="outline"
            className="w-full h-10 sm:h-12 border-dashed border-2 border-blue-300 text-blue-700 text-xs sm:text-sm hover:bg-blue-50 hover:border-blue-500"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter un bâtiment</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>

        {tableauSynthese.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Aucun bâtiment ajouté. Cliquez sur le bouton ci-dessus pour commencer.
          </div>
        )}
      </CardContent>
    </Card>
  );
}