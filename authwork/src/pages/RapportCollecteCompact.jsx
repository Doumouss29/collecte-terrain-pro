import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, Download } from 'lucide-react';
import ExportDataModal from '@/components/collecte/ExportDataModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import ReportFilters from '@/components/collecte/ReportFilters';

export default function RapportCollecteCompact() {
  const navigate = useNavigate();
  const [filteredCollectes, setFilteredCollectes] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [adminCommune, setAdminCommune] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const shouldPrint = urlParams.get('print') === 'true';
  const orgIdFromUrl = urlParams.get('organisation_id');

  const getNatureOccupationLabel = (val) => {
    const map = {
      'proprietaire': 'LOCAL OCCUPÉ PAR LE PROPRIÉTAIRE',
      'usine': 'USINE',
      'local_commercial': 'LOCAL COMMERCIAL',
      'local_professionnel': 'LOCAL PROFESSIONNEL OU ATELIER',
      'entrepot': 'ENTREPÔT',
      'habitation_louee': 'HABITATION LOUÉE',
      'inoccupe': 'LOCAL INOCCUPÉ',
      '1': 'LOCAL OCCUPÉ PAR LE PROPRIÉTAIRE',
      '2': 'USINE',
      '5': 'LOCAL COMMERCIAL',
      '6': 'LOCAL PROFESSIONNEL OU ATELIER',
      '7': 'ENTREPÔT',
      '8': 'HABITATION LOUÉE',
      '0': 'LOCAL INOCCUPÉ',
    };
    return map[val] || val || '';
  };

  const formatNature = (nature) => {
    if (!nature) return '';
    return nature.toLowerCase() === 'battie' ? 'BÂTIE' : nature;
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: selectedOrg } = useQuery({
    queryKey: ['organisation', orgIdFromUrl],
    queryFn: () => base44.entities.Organisation.filter({ id: orgIdFromUrl }),
    enabled: !!orgIdFromUrl,
    select: (data) => data?.[0],
  });

  const { data: collectes, isLoading } = useQuery({
    queryKey: ['collectes-validees', user?.organisation_id, user?.role, orgIdFromUrl, adminCommune],
    queryFn: async () => {
      if (!user) return [];
      if (user.role === 'admin') {
        if (orgIdFromUrl && adminCommune) {
          return await base44.entities.Collecte.filter({ statut: 'validee', organisation_id: orgIdFromUrl, commune: adminCommune });
        }
        if (orgIdFromUrl && !adminCommune) return [];
        return await base44.entities.Collecte.filter({ statut: 'validee' });
      }
      if (user.role === 'superviseur') {
        const all = await base44.entities.Collecte.filter({ statut: 'validee', organisation_id: user.organisation_id });
        if (user.communes_supervisees?.length > 0) {
          return all.filter(c => user.communes_supervisees.includes(c.commune?.toUpperCase()));
        }
        return all;
      }
      if (user.organisation_id) {
        // Agent : uniquement ses propres collectes validées
        return await base44.entities.Collecte.filter({ statut: 'validee', created_by: user.email });
      }
      return [];
    },
    enabled: !userLoading && !!user && (user.role !== 'admin' || !orgIdFromUrl || !!adminCommune),
  });

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @page { 
        size: A4; 
        margin: 12mm;
      }
      @media print {
        .print-hide { display: none !important; }
        body { margin: 0; padding: 0; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        @page { margin: 0; }
        html { margin: 0; }
      }
    `;
    document.head.appendChild(style);
    document.title = '';
    return () => document.head.removeChild(style);
  }, []);

  React.useEffect(() => {
    if (!userLoading && user && !user.organisation_id && user.role !== 'admin') {
      navigate(createPageUrl('Accueil'));
    }
  }, [user, userLoading, navigate]);

  React.useEffect(() => {
    if (collectes && collectes.length > 0) {
      const ids = urlParams.get('ids');
      if (ids) {
        const idList = ids.split(',');
        setFilteredCollectes(collectes.filter(c => idList.includes(c.id)));
      } else {
        setFilteredCollectes(collectes);
      }
    }
  }, [collectes, shouldPrint]);

  React.useEffect(() => {
    if (shouldPrint && filteredCollectes && filteredCollectes.length > 0) {
      setTimeout(() => window.print(), 500);
    }
  }, [shouldPrint, filteredCollectes]);

  const handlePrint = () => {
    const ids = filteredCollectes.map(c => c.id).join(',');
    navigate(`${createPageUrl('RapportCollecteCompact')}?print=true&ids=${ids}`);
  };

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  // Admin avec org mais sans commune → afficher sélecteur
  if (user && user.role === 'admin' && orgIdFromUrl && !adminCommune) {
    const communes = selectedOrg?.communes || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
            <Button onClick={() => navigate(createPageUrl('Accueil'))} className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center flex-shrink-0">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" /><span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-base sm:text-2xl font-bold text-center">Rapport Compact</h1>
            <div className="w-9 sm:w-24 flex-shrink-0"></div>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pt-10">
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 block">
              Commune <span className="text-red-500">*</span>
            </label>
            <select
              value={adminCommune}
              onChange={e => setAdminCommune(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
            >
              <option value="">— Sélectionner une commune —</option>
              {[...communes].sort().map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-slate-400 italic mt-3">Sélectionnez une commune pour afficher le rapport.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (!user.organisation_id && user.role !== 'admin') || !collectes || collectes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Aucune collecte validée</h2>
        <Button onClick={() => navigate(createPageUrl('Accueil'))}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="print-hide bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={() => navigate(createPageUrl('Accueil'))}
              className="bg-white text-slate-900 hover:bg-gray-100 h-9 w-9 sm:h-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-base sm:text-2xl font-bold text-center flex-1">Rapport Compact</h1>
            {user?.role === 'admin' && (
              <Button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-3 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Export</span>
              </Button>
            )}
            {user?.role !== 'admin' && <div className="w-9 sm:w-10"></div>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="print-hide max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <ReportFilters collectes={collectes} onFilter={setFilteredCollectes} onPrint={handlePrint} />
      </div>

      {user?.role === 'admin' && collectes && (
        <ExportDataModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          collectes={collectes}
        />
      )}

      {/* Reports */}
      <div className="max-w-[210mm] mx-auto bg-white sm:max-w-[210mm]">
        {filteredCollectes.map((collecte, index) => (
          <div key={collecte.id} className="text-black" style={{fontSize: '12px', fontFamily: 'Times New Roman, serif', pageBreakBefore: index > 0 ? 'always' : 'auto'}}>
            {/* PAGE 1 */}
            <div className="page p-4 sm:p-8">
              {/* Header */}
              <div className="border border-black p-2 mb-2 text-center">
                <div className="font-bold text-base tracking-wide">MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
                <div className="text-xs font-bold mt-1">DIRECTION GÉNÉRALE DES IMPÔTS<br/>DIRECTION DU CADASTRE</div>
                <div className="text-xs mt-1">TEL 22 - 68 - 97 / 21 - 84 - 67</div>
              </div>

              {/* Info Parcelle */}
              <div className="border border-black mb-1.5 sm:mb-2">
                <div className="p-1.5 text-center font-bold uppercase border-b border-black">
                  OPÉRATION DE RECENSEMENT DES PROPRIÉTAIRES FONCIERS
                </div>
                <div className="p-1.5 sm:p-2 grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 text-xs">
                  <div className="flex gap-2"><span>Commune :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.commune || ''}</span></div>
                  <div className="flex gap-2"><span>Section :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.section || ''}</span></div>
                  <div className="flex gap-2"><span>Parcelle :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.parcelle || ''}</span></div>
                  <div className="flex gap-2"><span>Code exemption :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.code_exemption || ''}</span></div>
                  <div className="flex gap-2"><span>Année ACQ :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.annee_acq || ''}</span></div>
                  <div className="flex gap-2"><span>Nature :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{formatNature(collecte.nature)}</span></div>
                  <div className="flex gap-2"><span>Surf. imposable :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.surface_imposable || ''}</span></div>
                  <div className="flex gap-2"><span>Val. vénale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.valeur_venale || ''}</span></div>
                  <div className="flex gap-2"><span>Code VV :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.code_vv || ''}</span></div>
                  <div className="flex gap-2"><span>Quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.quartier || ''}</span></div>
                  <div className="flex gap-2"><span>Code quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.code_quartier || ''}</span></div>
                  <div className="flex gap-2"><span>T.F. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.tf || ''}</span></div>
                  <div className="flex gap-2"><span>Lot :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.lot || ''}</span></div>
                  <div className="flex gap-2"><span>Ilot :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.ilot || ''}</span></div>
                  <div className="flex gap-2"><span>N° Appart. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.num_appartement || ''}</span></div>
                  <div className="flex gap-2"><span>Niveau appart. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.niveau_appartement || ''}</span></div>
                  <div className="flex gap-2"><span>Latitude (Y) :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.latitude || ''}</span></div>
                  <div className="flex gap-2"><span>Longitude (X) :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.longitude || ''}</span></div>
                  <div></div>
                </div>
                <table className="w-full border-collapse" style={{borderTop: '1px solid black'}}>
                  <tbody>
                    <tr>
                      <td style={{width: '60%', borderRight: '1px solid black', padding: '6px 4px'}}></td>
                      <td className="text-xs font-bold" style={{width: '40%', padding: '6px 6px'}}>
                        <div style={{display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap'}}>
                          <span>DGI IN 99 –</span>
                          <span>{collecte.reference_dgi || '000001'}</span>
                          <span style={{flex: 1, borderBottom: '1px dotted black', display: 'inline-block', minWidth: '60px'}}></span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 1 - Propriétaire */}
              <div className="py-0.5 sm:py-1 font-bold uppercase text-xs sm:text-sm mb-0.5 sm:mb-1">
                1 - RENSEIGNEMENTS CONCERNANT LE PROPRIÉTAIRE
              </div>

              {/* Particulier */}
              <div className="text-xs font-bold mb-0.5 sm:mb-1">a) Si le propriétaire est un particulier</div>
              <div className="border border-black p-1.5 sm:p-2 mb-1.5 sm:mb-2">
                <div className="flex justify-between mb-2">
                <span className="font-bold">Identité du propriétaire</span>
                <div className="flex gap-2 text-xs">
                  <span>N° compte contribuable :</span>
                  <span className="border-b border-dotted border-black font-bold uppercase" style={{minWidth: '150px'}}>{collecte.prop_compte_contribuable || ''}</span>
                </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                <div className="flex gap-1 sm:gap-2"><span className="min-w-fit">Nom :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_nom || ''}</span></div>
                <div className="flex gap-2"><span>Prénoms :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_prenoms || ''}</span></div>
                <div className="flex gap-2"><span>Date naissance :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_date_naissance || ''}</span></div>
                <div className="flex gap-2"><span>Lieu naissance :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_lieu_naissance || ''}</span></div>
                <div className="flex gap-2"><span>Sous-Préfecture :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_sous_prefecture || ''}</span></div>
                <div className="flex gap-2"><span>Pays :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_pays || ''}</span></div>
                <div className="flex gap-2"><span>N° carte identité :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_carte_identite || ''}</span></div>
                <div className="flex gap-2"><span>Nationalité :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_nationalite || ''}</span></div>
                <div className="flex gap-2"><span>Autre pièce :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_autre_piece || ''}</span></div>
                <div className="flex gap-2"><span>N° :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_autre_piece_numero || ''}</span></div>
                <div className="flex gap-2"><span>Nom Père :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_nom_pere || ''}</span></div>
                <div className="flex gap-2"><span>Nom Mère :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_nom_mere || ''}</span></div>
                </div>
              </div>

              {/* Adresse résidence */}
              <div className="border border-black p-1.5 sm:p-2 mb-1.5 sm:mb-2">
                <div className="font-bold text-xs mb-1">Adresse de résidence</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                  <div className="flex gap-2"><span>Adresse postale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_adresse_postale || ''}</span></div>
                  <div className="flex gap-2"><span>B.P. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_bp || ''}</span></div>
                  <div className="flex gap-2"><span>Ville :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_ville || ''}</span></div>
                  <div className="flex gap-2"><span>Tél. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_tel || ''}</span></div>
                  <div className="flex gap-2"><span>Quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_quartier_residence || ''}</span></div>
                  <div className="flex gap-2"><span>T.F. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_adresse_tf || ''}</span></div>
                  <div className="flex gap-2"><span>Informations complémentaires :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prop_infos_complementaires || ''}</span></div>
                  <div></div>
                </div>
              </div>

              {/* Situation famille + Profession */}
              <div className="border border-black p-1.5 sm:p-2 mb-1.5 sm:mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <div className="font-bold text-xs mb-1">Situation de famille (1)</div>
                    <div className="text-xs font-bold uppercase">{collecte.situation_familiale || ''}</div>
                  </div>
                  <div>
                    <div className="font-bold text-xs mb-1">Nombre d'enfants à charge (2) :</div>
                    <div className="border-b border-dotted border-black text-xs font-bold uppercase">{collecte.nombre_enfants || ''}</div>
                  </div>
                </div>
              </div>

              <div className="border border-black p-1.5 sm:p-2 mb-1.5 sm:mb-2">
                <div className="font-bold text-xs mb-1">Adresse professionnelle</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                  <div className="flex gap-2"><span>Profession :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_profession || ''}</span></div>
                  <div className="flex gap-2"><span>Service employeur :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_service_employeur || ''}</span></div>
                  <div className="flex gap-2"><span>Adresse postale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_adresse_postale || ''}</span></div>
                  <div className="flex gap-2"><span>B.P. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_bp || ''}</span></div>
                  <div className="flex gap-2"><span>Ville :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_ville || ''}</span></div>
                  <div className="flex gap-2"><span>Tél. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_tel || ''}</span></div>
                  <div className="flex gap-2"><span>Quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.prof_quartier || ''}</span></div>
                  <div></div>
                </div>
              </div>

              {/* Footer - Signature Propriétaire Particulier */}
              {collecte.type_proprietaire === 'particulier' && (
              <div className="mt-4 text-xs">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <span>Date :</span>
                    <span>
                      {collecte.prop_signature_date ? format(new Date(collecte.prop_signature_date), 'dd/MM/yyyy') : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <div>Signature,</div>
                    {collecte.prop_photo_signature && (
                      <div className="my-2 flex justify-end">
                        <img src={collecte.prop_photo_signature} alt="Signature" className="max-h-[35px] max-w-[150px] h-auto w-auto" />
                      </div>
                    )}
                    <div className="mb-4">
                      {collecte.prop_signature || ''}
                    </div>
                  </div>
                </div>
                  </div>
                  )}
            </div>

            {/* PAGE 2 */}
            <div className="page p-4 sm:p-8">
              {/* Société */}
              <div className="text-xs font-bold mb-0.5 sm:mb-1">b) Si le propriétaire est une société ou autre personne morale ou une entreprise individuelle (3)</div>
              <div className="border border-black p-1.5 sm:p-2 mb-1.5 sm:mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                  <div className="flex gap-2"><span>Nom ou raison sociale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_raison_sociale || ''}</span></div>
                  <div className="flex gap-2"><span>N° Compte contribuable :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_compte_contribuable || ''}</span></div>
                  <div className="flex gap-2"><span>N° Registre de Commerce :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_registre_commerce || ''}</span></div>
                  <div className="flex gap-2"><span>Tél. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_tel || ''}</span></div>
                  <div className="flex gap-2"><span>Adresse postale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_adresse_postale || ''}</span></div>
                  <div className="flex gap-2"><span>B.P. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_bp || ''}</span></div>
                  <div className="flex gap-2"><span>Ville :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_ville || ''}</span></div>
                  <div className="flex gap-2"><span>Quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_quartier || ''}</span></div>
                  <div className="flex gap-2"><span>Ilot :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_ilot || ''}</span></div>
                  <div className="flex gap-2"><span>Lot :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_lot || ''}</span></div>
                  <div className="flex gap-2"><span>T.F. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.societe_tf || ''}</span></div>
                  <div></div>
                </div>
              </div>

              {/* Footer - Signature Propriétaire Société */}
              {collecte.type_proprietaire === 'societe' && (
              <div className="mt-4 text-xs">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <span>Date :</span>
                    <span>
                      {collecte.societe_signature_date ? format(new Date(collecte.societe_signature_date), 'dd/MM/yyyy') : (collecte.prop_signature_date ? format(new Date(collecte.prop_signature_date), 'dd/MM/yyyy') : '')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div>Signature,</div>
                    {(collecte.societe_photo_signature || collecte.prop_photo_signature) && (
                      <div className="my-2 flex justify-end">
                        <img src={collecte.societe_photo_signature || collecte.prop_photo_signature} alt="Signature" className="max-h-[35px] max-w-[150px] h-auto w-auto" />
                      </div>
                    )}
                    <div className="mb-4">
                      {collecte.societe_signature || collecte.prop_signature || ''}
                    </div>
                  </div>
                </div>
                  </div>
                  )}

              <div className="py-0.5 sm:py-1 font-bold uppercase text-xs sm:text-sm mb-1 sm:mb-2">
                2 - RENSEIGNEMENTS CONCERNANT LE BIEN
              </div>

              <div className="border border-black p-1.5 sm:p-2">
                <div className="flex gap-2 text-xs mb-2">
                  <span>Description de l'immeuble :</span>
                  <span className="flex-1 border-b border-dotted border-black"></span>
                </div>

                <div className="flex gap-2 text-xs mb-3">
                  <span>Nature du local (4) :</span>
                  <span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.bien_nature_local || ''}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs mb-2 sm:mb-3">
                  <div className="flex gap-1 sm:gap-2">
                    <span className="min-w-fit">Le local est-il équipé d'eau ?</span>
                    <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{collecte.bien_equipe_eau ? 'Oui' : 'Non'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>d'électricité ?</span>
                    <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{collecte.bien_equipe_electricite ? 'Oui' : 'Non'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>Nombre de niveaux :</span>
                    <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{collecte.bien_nombre_niveaux || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>Nombre de bâtiments :</span>
                    <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{collecte.bien_nombre_batiments || ''}</span>
                  </div>
                </div>

                <div className="text-xs font-bold mb-1 sm:mb-2">Préciser (5) :</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs mb-2 sm:mb-3">
                  <div>- Année d'achèvement des travaux : <span className="border-b border-dotted border-black font-bold uppercase">{collecte.bien_annee_achevement || ''}</span></div>
                  <div>- Nature de l'occupation : <span className="border-b border-dotted border-black font-bold uppercase">{getNatureOccupationLabel(collecte.bien_nature_occupation)}</span></div>
                  <div>- Valeur locative mensuelle : <span className="border-b border-dotted border-black font-bold uppercase">{collecte.bien_valeur_locative_mensuelle || ''}</span></div>
                  <div>- Nombre de pièces : <span className="border-b border-dotted border-black font-bold uppercase">{collecte.bien_nombre_pieces || ''}</span></div>
                </div>

                <div className="mt-8 text-right text-xs">
                  <div style={{marginBottom: '10px'}}>Nom et signature de l'Agent recenseur</div>
                  {collecte.signature_agent_photo && (
                    <div style={{marginBottom: '5px', display: 'flex', justifyContent: 'flex-end'}}>
                      <img src={collecte.signature_agent_photo} alt="Signature" style={{maxHeight: '40px', maxWidth: '150px'}} />
                    </div>
                  )}
                  <div style={{minWidth: '200px', display: 'inline-block'}}>
                    {collecte.signature_agent || ''}
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 3 */}
            <div className="page p-4 sm:p-8">
              <div className="py-1 font-bold uppercase text-sm mb-4">
                3 - TABLEAU DE SYNTHÈSE
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="font-bold">
                    <th className="border border-black p-2 text-left">AN. ACH. TRAV.</th>
                    <th className="border border-black p-2 text-left">NATURE DE L'OCCUPATION (6)</th>
                    <th className="border border-black p-2 text-left">VAL. LOCAT. AN.</th>
                    <th className="border border-black p-2 text-left">NB. PIECES</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: 8}).map((_, i) => {
                    const row = collecte.tableau_synthese?.[i];
                    return (
                      <tr key={i} style={{height: '18mm'}}>
                        <td className="border border-black p-2 font-bold uppercase">{row?.annee_achevement || ''}</td>
                        <td className="border border-black p-2 font-bold uppercase">{getNatureOccupationLabel(row?.nature_occupation)}</td>
                        <td className="border border-black p-2 font-bold uppercase">{row?.valeur_locative_annuelle || ''}</td>
                        <td className="border border-black p-2 font-bold uppercase">{row?.nombre_pieces || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGE 4 */}
            <div className="page p-4 sm:p-8">
              <div className="py-1 font-bold uppercase text-sm mb-4">
                4 - GESTION <span className="text-xs normal-case">(si le bien est géré par une Agence, un huissier ou autre)</span>
              </div>

              <div className="border border-black p-1.5 sm:p-2 mb-2 sm:mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                  <div className="flex gap-2"><span>Nom / raison sociale de l'Agence :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_raison_sociale || ''}</span></div>
                  <div className="flex gap-2"><span>N° Compte contribuable :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_compte_contribuable || ''}</span></div>
                  <div className="flex gap-2"><span>Adresse postale :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_adresse_postale || ''}</span></div>
                  <div className="flex gap-2"><span>B.P. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_bp || ''}</span></div>
                  <div className="flex gap-2"><span>Ville :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_ville || ''}</span></div>
                  <div className="flex gap-2"><span>Tél. :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_tel || ''}</span></div>
                  <div className="flex gap-2"><span>Quartier :</span><span className="flex-1 border-b border-dotted border-black font-bold uppercase">{collecte.agence_quartier || ''}</span></div>
                  <div></div>
                </div>
              </div>

              <div className="text-xs leading-relaxed" style={{marginTop: '10px'}}>
                <div>(1) Mettre une croix dans la case correspondant à votre disposition ;</div>
                <div>(2) Enfants à charge : mineurs, étudiants jusqu'à 25 ans, handicapés ;</div>
                <div>(3) État, Ambassade, Culte, O.N.G., Commune ;</div>
                <div>(4) Précisez : immeuble collectif/maison/logement/cour commune ; local commercial/industriel/artisanal/bureau ;</div>
                <div>(6) 1-Propriétaire ; 2-Usine ; 5-Commercial ; 6-Professionnel/atelier ; 7-Entrepôt ; 8-Habitation logée ; 0-Inoccupé.</div>
              </div>
            </div>

            {/* PAGE 5 */}
            <div className="page p-4 sm:p-8">
              <div className="py-1 font-bold uppercase text-sm mb-4">
                5 - PHOTOS / PIÈCES JOINTES
              </div>

              {/* Photos d'identité */}
              <div className="mb-6">
                <div className="text-xs font-bold mb-3">A) Photos d'identité du propriétaire :</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-2">Photo carte d'identité (recto) :</div>
                    {collecte.prop_photo_carte_identite_recto ? (
                      <img src={collecte.prop_photo_carte_identite_recto} alt="Carte identité recto" className="w-full border border-black" style={{maxHeight: '80mm'}} />
                    ) : (
                      <div className="border border-black p-4 text-center text-xs text-slate-400" style={{height: '80mm', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Aucune photo</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs mb-2">Photo carte d'identité (verso) :</div>
                    {collecte.prop_photo_carte_identite_verso ? (
                      <img src={collecte.prop_photo_carte_identite_verso} alt="Carte identité verso" className="w-full border border-black" style={{maxHeight: '80mm'}} />
                    ) : (
                      <div className="border border-black p-4 text-center text-xs text-slate-400" style={{height: '80mm', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Aucune photo</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos de l'immeuble */}
              <div>
                <div className="text-xs font-bold mb-3">B) Photos de l'immeuble :</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-2">Photo générale :</div>
                    {collecte.bien_photo_general ? (
                      <img src={collecte.bien_photo_general} alt="Photo générale" className="w-full border border-black" style={{maxHeight: '60mm'}} />
                    ) : (
                      <div className="border border-black p-4 text-center text-xs text-slate-400" style={{height: '60mm', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Aucune photo</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs mb-2">Photo façade :</div>
                    {collecte.bien_photo_facade ? (
                      <img src={collecte.bien_photo_facade} alt="Photo façade" className="w-full border border-black" style={{maxHeight: '60mm'}} />
                    ) : (
                      <div className="border border-black p-4 text-center text-xs text-slate-400" style={{height: '60mm', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Aucune photo</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs mb-2">Photo entrée :</div>
                    {collecte.bien_photo_entree ? (
                      <img src={collecte.bien_photo_entree} alt="Photo entrée" className="w-full border border-black" style={{maxHeight: '60mm'}} />
                    ) : (
                      <div className="border border-black p-4 text-center text-xs text-slate-400" style={{height: '60mm', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Aucune photo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}