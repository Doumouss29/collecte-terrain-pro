import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ADMIN_FIELDS = [
  // Parcelle
  'commune', 'section', 'parcelle', 'code_exemption', 'annee_acq', 'nature', 
  'surface_imposable', 'valeur_venale', 'code_vv', 'quartier', 'code_quartier', 
  'tf', 'lot', 'ilot', 'num_appartement', 'niveau_appartement', 'reference_dgi',
  
  // Propriétaire - Particulier
  'prop_nom', 'prop_prenoms', 'prop_lieu_naissance', 'prop_sous_prefecture', 
  'prop_pays', 'prop_carte_identite', 'prop_nationalite', 'prop_autre_piece',
  'prop_autre_piece_numero', 'prop_compte_contribuable', 'prop_nom_pere', 'prop_nom_mere',
  'prop_adresse_postale', 'prop_bp', 'prop_ville', 'prop_quartier_residence', 'prop_tel',
  'prop_adresse_tf', 'prop_infos_complementaires', 'situation_familiale',
  'prof_profession', 'prof_service_employeur', 'prof_adresse_postale', 'prof_bp',
  'prof_ville', 'prof_quartier', 'prof_tel',
  
  // Propriétaire - Société
  'societe_raison_sociale', 'societe_registre_commerce', 'societe_compte_contribuable',
  'societe_adresse_postale', 'societe_bp', 'societe_ville', 'societe_quartier', 'societe_tel',
  'societe_ilot', 'societe_lot', 'societe_tf',
  
  // Bien
  'bien_nature_local', 'bien_annee_achevement', 'bien_nature_occupation',
  'bien_valeur_locative_mensuelle', 'bien_nombre_pieces',
  
  // Gestion
  'agence_raison_sociale', 'agence_compte_contribuable', 'agence_adresse_postale',
  'agence_bp', 'agence_ville', 'agence_quartier', 'agence_tel'
];

export function useLastEnteredValues() {
  const { data: collectes = [] } = useQuery({
    queryKey: ['lastEnteredValues'],
    queryFn: () => base44.entities.Collecte.list('-created_date', 50),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const getLastValues = () => {
    if (collectes.length === 0) return {};

    const lastCollecte = collectes[0];
    const result = {};

    ADMIN_FIELDS.forEach(field => {
      const value = lastCollecte[field];
      if (value && typeof value === 'string' && value.trim()) {
        result[field] = value.trim();
      }
    });

    return result;
  };

  return { getLastValues };
}