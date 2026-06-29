import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  User,
  Building2,
  Home,
  Table,
  Building,
  Pen,
  Trash2,
  Loader2,
  Edit,
  CheckCircle,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import CollecteHeader from '@/components/collecte/CollecteHeader';
import CollecteCoverPage from '@/components/collecte/CollecteCoverPage';
import BackButton from '@/components/navigation/BackButton';


export default function DetailCollecte() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const collecteId = urlParams.get('id');
  const shouldPrint = urlParams.get('print') === 'true';

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .print-hide { display: none !important; }
        .min-h-screen { min-height: auto; }
        .pb-8 { padding-bottom: 0; }
        button { display: none !important; }
      }
      @page {
        margin: 0;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const { data: collecte, isLoading } = useQuery({
    queryKey: ['collecte', collecteId],
    queryFn: async () => {
      const results = await base44.entities.Collecte.filter({ id: collecteId });
      return results[0];
    },
    enabled: !!collecteId
  });

  React.useEffect(() => {
    if (shouldPrint && collecte) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [shouldPrint, collecte]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const convocations = await base44.entities.ConvocationParcelle.filter({
        organisation_id: collecte.organisation_id,
        commune: collecte.commune,
        section: collecte.section,
        parcelle: collecte.parcelle,
        statut: 'active'
      });

      await Promise.all(
        convocations
          .filter((convocation) =>
            (!collecte.lot || convocation.lot === collecte.lot) &&
            (!collecte.ilot || convocation.ilot === collecte.ilot)
          )
          .map((convocation) => base44.entities.ConvocationParcelle.update(convocation.id, { statut: 'recensee' }))
      );

      return base44.entities.Collecte.delete(collecteId);
    },
    onSuccess: () => {
      toast.success('Collecte supprimée');
      navigate(createPageUrl('MesCollectes'));
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });



  const handlePrint = (collecteId) => {
    window.open(createPageUrl('DetailCollecte') + `?id=${collecteId}&print=true`, '_blank');
  };


  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'brouillon':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Brouillon</Badge>;
      case 'validee':
        return <Badge className="bg-green-100 text-green-800">Validée</Badge>;
      case 'complete':
        return <Badge className="bg-amber-100 text-amber-800">Complète</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

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
    return map[val] || val || '-';
  };

  const InfoRow = ({ label, value }) => (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <p className="font-medium text-slate-800">{value || '-'}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (!collecte) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Collecte non trouvée</h2>
        <Link to={createPageUrl('MesCollectes')}>
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      <CollecteCoverPage collecte={collecte} />
      
      {/* Header */}
      <div className="print-hide bg-gradient-to-r from-blue-800 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-3 sm:px-4">
          {/* Bouton retour */}
          <div className="py-3 sm:py-4">
            <button
              onClick={() => navigate(createPageUrl('MesCollectes'))}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Retour</span>
            </button>
          </div>

          {/* Titre et statut centrés */}
          <div className="text-center py-4 sm:py-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <h1 className="text-xl sm:text-3xl font-bold">{collecte.commune || 'Collecte'}</h1>
              {getStatusBadge(collecte.statut)}
            </div>
            <p className="text-blue-100 text-xs sm:text-sm">
              Créée le {format(new Date(collecte.created_date), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          
          {/* Boutons d'action centrés */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center py-4 sm:py-6 border-t border-blue-700">
            <Link to={createPageUrl('EditerCollecte') + `?id=${collecteId}`}>
              <Button variant="secondary" className="bg-white hover:bg-slate-100 text-slate-800 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Modifier</span>
                <span className="sm:hidden">Modifier</span>
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm">
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette collecte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données de cette collecte seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>



      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Parcelle */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-blue-800" />
              Informations Parcelle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Commune" value={collecte.commune} />
              <InfoRow label="Section" value={collecte.section} />
              <InfoRow label="Parcelle" value={collecte.parcelle} />
              <InfoRow label="Quartier" value={collecte.quartier} />
              <InfoRow label="Lot" value={collecte.lot} />
              <InfoRow label="Îlot" value={collecte.ilot} />
              <InfoRow label="Surface (m²)" value={collecte.surface_imposable} />
              <InfoRow label="Réf. DGI" value={collecte.reference_dgi} />
            </div>
          </CardContent>
        </Card>

        {/* Propriétaire */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              {collecte.type_proprietaire === 'societe' ? (
                <Building2 className="w-5 h-5 text-blue-800" />
              ) : (
                <User className="w-5 h-5 text-blue-800" />
              )}
              Propriétaire ({collecte.type_proprietaire === 'societe' ? 'Société' : 'Particulier'})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {collecte.type_proprietaire === 'societe' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Raison sociale" value={collecte.societe_raison_sociale} />
                <InfoRow label="N° Registre commerce" value={collecte.societe_registre_commerce} />
                <InfoRow label="N° Compte contribuable" value={collecte.societe_compte_contribuable} />
                <InfoRow label="Ville" value={collecte.societe_ville} />
                <InfoRow label="Quartier" value={collecte.societe_quartier} />
                <InfoRow label="Téléphone" value={collecte.societe_tel} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Nom" value={collecte.prop_nom} />
                <InfoRow label="Prénoms" value={collecte.prop_prenoms} />
                <InfoRow label="Nationalité" value={collecte.prop_nationalite} />
                <InfoRow label="Ville" value={collecte.prop_ville} />
                <InfoRow label="Quartier" value={collecte.prop_quartier_residence} />
                <InfoRow label="Téléphone" value={collecte.prop_tel} />
                <InfoRow label="Profession" value={collecte.prof_profession} />
                <InfoRow label="Situation familiale" value={collecte.situation_familiale} />
                <InfoRow label="Enfants à charge" value={collecte.nombre_enfants} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bien */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="w-5 h-5 text-blue-800" />
              Description du Bien
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Nature du local" value={getNatureLocalLabel(collecte.bien_nature_local)} />
              <InfoRow label="Équipé eau" value={collecte.bien_equipe_eau ? 'Oui' : 'Non'} />
              <InfoRow label="Équipé électricité" value={collecte.bien_equipe_electricite ? 'Oui' : 'Non'} />
              <InfoRow label="Nombre de niveaux" value={collecte.bien_nombre_niveaux} />
              <InfoRow label="Nombre de bâtiments" value={collecte.bien_nombre_batiments} />
              <InfoRow label="Nombre de pièces" value={collecte.bien_nombre_pieces} />
              <InfoRow label="Année achèvement" value={collecte.bien_annee_achevement} />
              <InfoRow label="Valeur locative mensuelle" value={collecte.bien_valeur_locative_mensuelle ? `${collecte.bien_valeur_locative_mensuelle} FCFA` : '-'} />
            </div>
          </CardContent>
        </Card>

        {/* Tableau Synthèse */}
        {collecte.tableau_synthese && collecte.tableau_synthese.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table className="w-5 h-5 text-blue-800" />
                Tableau de Synthèse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left text-slate-600">Année achèvement</th>
                      <th className="py-2 text-left text-slate-600">Nature occupation</th>
                      <th className="py-2 text-left text-slate-600">Valeur locative annuelle</th>
                      <th className="py-2 text-left text-slate-600">Nb. pièces</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collecte.tableau_synthese.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3">{row.annee_achevement || '-'}</td>
                        <td className="py-3">{row.nature_occupation || '-'}</td>
                        <td className="py-3">{row.valeur_locative_annuelle ? `${row.valeur_locative_annuelle} FCFA` : '-'}</td>
                        <td className="py-3">{row.nombre_pieces || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gestion */}
        {collecte.gestion_par_agence && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-blue-800" />
                Gestion par Agence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="Raison sociale" value={collecte.agence_raison_sociale} />
                <InfoRow label="N° Compte contribuable" value={collecte.agence_compte_contribuable} />
                <InfoRow label="Ville" value={collecte.agence_ville} />
                <InfoRow label="Quartier" value={collecte.agence_quartier} />
                <InfoRow label="Téléphone" value={collecte.agence_tel} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <Pen className="w-5 h-5" />
              Signature Agent Recenseur
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Date de collecte" value={collecte.date_collecte ? format(new Date(collecte.date_collecte), 'dd MMMM yyyy', { locale: fr }) : '-'} />
              <InfoRow label="Agent recenseur" value={collecte.signature_agent} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}