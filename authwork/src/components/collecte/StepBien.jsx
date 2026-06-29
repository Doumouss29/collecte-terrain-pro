import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Plus } from 'lucide-react';
import FormField from './FormField';
import PhotoBuildingUpload from './PhotoBuildingUpload';

export default function StepBien({ data, onChange }) {
  const isTerrainNu = data.bien_nature_local === 'terrain_nu';
  const hasSecondBuildingPhotos = !!(data.bien2_photo_facade || data.bien2_photo_entree || data.bien2_photo_general);
  const [showSecondBuilding, setShowSecondBuilding] = React.useState(hasSecondBuildingPhotos);
  
  const natureLocalOptions = [
    { value: 'immeuble_collectif', label: 'IMMEUBLE COLLECTIF' },
    { value: 'maison_individuelle', label: 'MAISON INDIVIDUELLE' },
    { value: 'logement_cour_commune', label: 'LOGEMENT COUR COMMUNE' },
    { value: 'local_commercial', label: 'LOCAL COMMERCIAL' },
    { value: 'local_industriel', label: 'LOCAL INDUSTRIEL' },
    { value: 'local_artisanal', label: 'LOCAL ARTISANAL' },
    { value: 'bureau', label: 'BUREAU' },
    { value: 'terrain_nu', label: 'TERRAIN NU' }
  ];

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
          <Home className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="line-clamp-2">Renseignements du Bien</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Description de l'immeuble</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <FormField
              label="Nature du local"
              name="bien_nature_local"
              type="select"
              value={data.bien_nature_local}
              onChange={onChange}
              options={natureLocalOptions}
              className="md:col-span-2"
            />
            {!isTerrainNu && (
              <>
                <FormField
                  label="Équipé en eau"
                  name="bien_equipe_eau"
                  type="checkbox"
                  value={data.bien_equipe_eau}
                  onChange={onChange}
                />
                <FormField
                  label="Équipé en électricité"
                  name="bien_equipe_electricite"
                  type="checkbox"
                  value={data.bien_equipe_electricite}
                  onChange={onChange}
                />
                <FormField
                  label="Nombre de niveaux"
                  name="bien_nombre_niveaux"
                  type="number"
                  value={data.bien_nombre_niveaux}
                  onChange={onChange}
                />
                <FormField
                  label="Nombre de bâtiments"
                  name="bien_nombre_batiments"
                  type="number"
                  value={data.bien_nombre_batiments}
                  onChange={onChange}
                />
              </>
            )}
          </div>
        </div>

        {!isTerrainNu && (
          <div className="bg-slate-50 p-2 sm:p-4 rounded-lg">
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 sm:mb-3">Détails supplémentaires</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <FormField
                  label="Année d'achèvement des travaux"
                  name="bien_annee_achevement"
                  value={data.bien_annee_achevement}
                  onChange={onChange}
                  placeholder="AAAA"
                  uppercase
                />
                <FormField
                  label="Nature de l'occupation"
                  name="bien_nature_occupation"
                  type="select"
                  value={data.bien_nature_occupation}
                  onChange={onChange}
                  options={natureOccupationOptions}
                />
                <FormField
                  label="Valeur locative mensuelle (FCFA)"
                  name="bien_valeur_locative_mensuelle"
                  type="number"
                  value={data.bien_valeur_locative_mensuelle}
                  onChange={onChange}
                />
                <FormField
                  label="Nombre de pièces"
                  name="bien_nombre_pieces"
                  type="number"
                  value={data.bien_nombre_pieces}
                  onChange={onChange}
                />
              </div>
            </div>
        )}

          <div className="space-y-4 sm:space-y-5">
            <h3 className="font-bold text-xs sm:text-sm text-slate-800">Photos de l'immeuble</h3>

            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-blue-900">Bâtiment 1</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <PhotoBuildingUpload
                  label="Photo façade"
                  fieldName="bien_photo_facade"
                  photoValue={data.bien_photo_facade}
                  onChange={onChange}
                />
                <PhotoBuildingUpload
                  label="Photo entrée"
                  fieldName="bien_photo_entree"
                  photoValue={data.bien_photo_entree}
                  onChange={onChange}
                />
                <PhotoBuildingUpload
                  label="Photo générale"
                  fieldName="bien_photo_general"
                  photoValue={data.bien_photo_general}
                  onChange={onChange}
                />
              </div>
            </div>

            {!showSecondBuilding ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSecondBuilding(true)}
                className="w-full sm:w-auto border-blue-200 text-blue-900 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bâtiment
              </Button>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-blue-900">Bâtiment 2</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <PhotoBuildingUpload
                    label="Photo façade"
                    fieldName="bien2_photo_facade"
                    photoValue={data.bien2_photo_facade}
                    onChange={onChange}
                  />
                  <PhotoBuildingUpload
                    label="Photo entrée"
                    fieldName="bien2_photo_entree"
                    photoValue={data.bien2_photo_entree}
                    onChange={onChange}
                  />
                  <PhotoBuildingUpload
                    label="Photo générale"
                    fieldName="bien2_photo_general"
                    photoValue={data.bien2_photo_general}
                    onChange={onChange}
                  />
                </div>
              </div>
            )}
          </div>
          </CardContent>
          </Card>
          );
          }