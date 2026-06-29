import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ChevronLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import BackButton from '@/components/navigation/BackButton';
import ReportFilters from '@/components/collecte/ReportFilters';
import ExportDataModal from '@/components/collecte/ExportDataModal';

export default function RapportCollecte() {
  const navigate = useNavigate();
  const [filteredCollectes, setFilteredCollectes] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [adminCommune, setAdminCommune] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const shouldPrint = urlParams.get('print') === 'true';
  const orgIdFromUrl = urlParams.get('organisation_id');

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
      @media print {
        .print-hide { display: none !important; }
        .min-h-screen { min-height: auto !important; }
        body { margin: 0; padding: 0; }
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
        
        /* Page de garde */
        .cover-page {
          page-break-after: always;
          height: 277mm !important;
          min-height: 277mm !important;
          padding: 15mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        
        /* Marges d'impression */
        @page {
          margin: 7mm 10mm 7mm 10mm;
          size: A4 portrait;
        }
        
        .rapport-section {
         position: relative;
         margin: 0;
         padding: 2mm 0;
        }

        /* Sections */
        .collecte-wrapper {
         page-break-before: always;
        }

        .collecte-wrapper:first-of-type {
         page-break-before: auto;
        }

        .rapport-section {
         page-break-inside: auto;
        }

        .page-break-after {
         page-break-after: always;
        }

        .section-title {
         background: linear-gradient(to right, #1e3a8a, #3b82f6);
         color: white;
         padding: 6px 12px;
         margin: -2mm 0 3mm 0;
         font-size: 12pt;
         font-weight: bold;
         border-radius: 4px;
        }
        
        /* Photos optimisées */
        .photo-item {
          page-break-inside: avoid;
          margin-bottom: 8mm;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .photo-item img {
          max-width: 300px !important;
          max-height: 200px !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
        }
        
        /* Blocs d'information */
        .info-block {
          page-break-inside: avoid;
          margin-bottom: 8mm;
          border-left: 4px solid #1e3a8a;
          padding-left: 12px;
          background: #eff6ff;
        }
        
        /* Tableaux */
        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: avoid;
          margin: 8mm 0;
        }
        
        table thead {
          background: #1e3a8a !important;
          color: white !important;
        }
        
        table tbody tr:nth-child(even) {
          background: #f1f5f9 !important;
        }
        
        table tbody tr:nth-child(odd) {
          background: white !important;
        }
        
        table td, table th {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          font-size: 10pt;
        }
        
        /* Signatures */
        .signature-box {
          border: 2px solid #1e3a8a;
          padding: 10mm;
          background: #eff6ff;
          page-break-inside: avoid;
        }
        
        img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
          page-break-inside: avoid;
        }
        
        h1, h2, h3 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        h1 + *, h2 + *, h3 + * {
          page-break-before: avoid;
        }
      }
      
      .table-of-contents {
        page-break-inside: avoid;
        page-break-after: always;
      }
      
      .page-break-inside-avoid {
        page-break-inside: avoid;
      }
    `;
    document.head.appendChild(style);
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
      setTimeout(() => {
        window.print();
        // Fermer le modal et nettoyer l'URL après l'impression
        setIsExportModalOpen(false);
        // Supprimer le paramètre print de l'URL
        const ids = urlParams.get('ids');
        if (ids) {
          window.history.replaceState({}, document.title, `${createPageUrl('RapportCollecte')}?ids=${ids}`);
        } else {
          window.history.replaceState({}, document.title, createPageUrl('RapportCollecte'));
        }
      }, 500);
    }
  }, [shouldPrint, filteredCollectes]);

  const handlePrint = () => {
    const ids = filteredCollectes.map(c => c.id).join(',');
    navigate(`${createPageUrl('RapportCollecte')}?print=true&ids=${ids}`);
  };

  const safeFormat = (dateStr, fmt, options = {}) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return format(d, fmt, options);
  };

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
    return map[val] || val || '-';
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

  const getProprietaireName = (collecte) => {
    if (!collecte) return '-';
    if (collecte.type_proprietaire === 'societe') {
      return collecte.societe_raison_sociale || '-';
    }
    const nom = collecte.prop_nom || '';
    const prenoms = collecte.prop_prenoms || '';
    return [prenoms, nom].filter(Boolean).join(' ') || '-';
  };

  const Section = ({ title, children, isNewCollecte = false, sectionNumber = null }) => (
    <div className={`rapport-section w-full bg-white p-4 sm:p-8 ${isNewCollecte ? 'section-break' : ''} page-break-after`}>
      <div className="section-title text-base sm:text-lg">
        {sectionNumber && <span className="mr-2">{sectionNumber}.</span>}
        {title}
      </div>
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );

  const PhotoIdGrid = ({ photos, labels }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {photos.map((photo, idx) => photo && (
        <div key={idx} className="border-2 border-slate-300 rounded-lg overflow-hidden photo-item">
          <p className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-2 text-xs sm:text-sm font-semibold">{labels[idx]}</p>
          <div className="w-full flex items-center justify-center bg-white p-3" style={{height: '200px'}}>
            <img src={photo} alt={labels[idx]} className="max-w-full max-h-full object-contain" loading="lazy" />
          </div>
        </div>
      ))}
    </div>
  );

  const PhotoBuildingGrid = ({ photos, labels }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {photos.map((photo, idx) => photo && (
        <div key={idx} className="border-2 border-slate-300 rounded-lg overflow-hidden photo-item">
          <p className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-2 text-xs sm:text-sm font-semibold text-center">{labels[idx]}</p>
          <div className="w-full flex items-center justify-center bg-white p-3" style={{height: '200px'}}>
            <img src={photo} alt={labels[idx]} className="max-w-full max-h-full object-contain" loading="lazy" />
          </div>
        </div>
      ))}
    </div>
  );

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (!user || (!user.organisation_id && user.role !== 'admin')) {
    return null;
  }

  // Admin avec org mais sans commune sélectionnée → afficher sélecteur
  if (user.role === 'admin' && orgIdFromUrl && !adminCommune) {
    const communes = selectedOrg?.communes || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
            <Button onClick={() => navigate(createPageUrl('Accueil'))} className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center flex-shrink-0">
              <ChevronLeft className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-center">Rapport Détaillé</h1>
            <div className="w-10 sm:w-24 flex-shrink-0"></div>
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

  if (!collectes || collectes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Aucune collecte validée</h2>
        <Button onClick={() => navigate(createPageUrl('Accueil'))}>Retour</Button>
      </div>
    );
  }

  if (filteredCollectes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Button
              onClick={() => navigate(createPageUrl('MesCollectes'))}
              className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:h-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Rapport Détaillé</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
          <ReportFilters collectes={collectes} onFilter={setFilteredCollectes} />
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Aucun résultat pour vos filtres</h2>
            <Button variant="outline" onClick={() => setFilteredCollectes(collectes)}>
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white print:bg-white rapport-content">
      {/* Header */}
       <div className="print-hide bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
           <div className="flex items-center justify-between gap-3">
             <Button
               onClick={() => navigate(createPageUrl('MesCollectes'))}
               className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:h-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
             >
               <ChevronLeft className="w-5 h-5 sm:mr-2" />
               <span className="hidden sm:inline">Retour</span>
             </Button>
             <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Rapport Détaillé</h1>
             {user?.role === 'admin' && (
               <Button
                 onClick={() => setIsExportModalOpen(true)}
                 className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-3 sm:px-4 flex items-center gap-2"
               >
                 <Download className="w-4 h-4" />
                 <span className="hidden sm:inline">Export</span>
               </Button>
             )}
             {user?.role !== 'admin' && <div className="w-9 sm:w-10"></div>}
             </div>
             </div>
             </div>

       {/* Bouton Imprimer et Filtres */}
       <div className="print-hide max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
         <ReportFilters collectes={collectes} onFilter={setFilteredCollectes} onPrint={handlePrint} />
       </div>

       {user?.role === 'admin' && collectes && (
         <ExportDataModal
           isOpen={isExportModalOpen}
           onClose={() => setIsExportModalOpen(false)}
           collectes={collectes}
         />
       )}

      {/* Page de Garde */}
      <div className="w-full min-h-screen bg-white p-8 sm:p-12 flex flex-col justify-center items-center page-break-after cover-page text-slate-900 gap-8">
        {/* Blue Banner */}
        <div className="w-full h-3 bg-blue-800 mb-2"></div>
        
        {/* Header Ministère */}
        <div className="text-center mb-4">
          <p className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
          <p className="text-xs sm:text-sm font-semibold mt-2 text-slate-700">Union - Discipline - Travail</p>
        </div>

        {/* Ministry Section */}
        <div className="text-center">
          <p className="text-sm sm:text-lg font-bold mb-4 text-slate-900">MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</p>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69763698f133e8ecb1784749/ea6fdd7e1_DGI.png" alt="Logo DGI" className="h-24 sm:h-32 mx-auto drop-shadow-lg" />

        </div>

        {/* Main Title */}
        <div className="w-full max-w-2xl">
          <div className="border-2 border-blue-800 rounded-lg p-8 sm:p-10 text-center bg-blue-50">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 text-slate-900">RAPPORT DE RECENSEMENT</h1>
            <h2 className="text-lg sm:text-2xl font-semibold text-blue-800 mb-6">DES PROPRIÉTAIRES FONCIERS</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-800">Année {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Total Collectes */}
        <div className="w-full max-w-2xl">
          <div className="border-2 border-blue-800 rounded-lg p-8 sm:p-10 text-center bg-blue-50">
            <p className="text-xs sm:text-sm text-blue-800 font-semibold uppercase tracking-wider mb-4">Total Collectes Validées</p>
            <p className="text-6xl sm:text-7xl font-bold mb-8 text-blue-900">{filteredCollectes.length}</p>
            <div className="border-t border-blue-200 pt-4">
              <p className="text-sm sm:text-base font-semibold text-slate-900">Rapport généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table des matières */}
      {(() => {
        const groupedByCommune = filteredCollectes.reduce((acc, collecte) => {
          const commune = collecte.commune || 'Commune non spécifiée';
          if (!acc[commune]) acc[commune] = [];
          acc[commune].push(collecte);
          return acc;
        }, {});

        let pageNumber = 1;
        
        Object.entries(groupedByCommune).forEach(([commune]) => {
          pageNumber += groupedByCommune[commune].length;
        });

        pageNumber = 1;

        return (
          <div className="w-full bg-white p-6 sm:p-8 section-break table-of-contents">
            <div className="mb-6 pb-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4 rounded-lg">
              <h1 className="text-lg sm:text-xl font-bold">TABLE DES MATIÈRES</h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">{filteredCollectes.length} collectes validées</p>
            </div>
            <div className="space-y-6">
              {Object.entries(groupedByCommune).map(([commune, collectesGroup], communeIdx) => {
                const startPage = pageNumber;
                const content = (
                  <div key={commune} className="space-y-2">
                    <div className="flex justify-between items-baseline gap-4 pb-2 border-b border-slate-200">
                      <div className="flex items-baseline gap-3 flex-1">
                        <span className="text-slate-800 font-bold text-sm sm:text-base">{communeIdx + 1}.</span>
                        <span className="text-slate-800 font-semibold text-sm sm:text-base uppercase tracking-wide">{commune}</span>
                      </div>
                      <span className="text-slate-400 text-xs sm:text-sm whitespace-nowrap">p. {startPage}</span>
                    </div>
                    <div className="ml-6 sm:ml-8 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                      {collectesGroup.map((collecte) => {
                        const currentPage = pageNumber++;
                        return (
                          <div key={collecte.id} className="flex justify-between items-center gap-1 group">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-blue-600 text-xs flex-shrink-0">•</span>
                              <span className="text-slate-700 text-xs truncate">{getProprietaireName(collecte)}</span>
                            </div>
                            <span className="text-slate-400 text-xs whitespace-nowrap ml-1">p. {currentPage}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
                return content;
              })}
            </div>
          </div>
        );
      })()}

      {/* Rapport - Collectes */}
      {filteredCollectes.map((collecte, collecteIndex) => (
        <div key={collecte.id} className="collecte-wrapper">
          {/* Page de présentation de la parcelle */}
          <div className="w-full min-h-screen bg-white p-8 sm:p-12 flex flex-col justify-center items-center page-break-after cover-page">
            <div className="w-full max-w-2xl">
              <div className="border-2 border-blue-800 rounded-lg p-8 sm:p-10 bg-blue-50">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8 text-center">PARCELLE {collecte.parcelle || '-'}</h2>

                <div className="space-y-6 text-center">
                  <div className="border-b-2 border-blue-200 pb-6">
                    <p className="text-xs text-blue-700 uppercase tracking-widest font-semibold mb-2">Commune</p>
                    <p className="text-2xl font-bold text-slate-800">{collecte.commune || '-'}</p>
                  </div>

                  <div className="border-b-2 border-blue-200 pb-6">
                    <p className="text-xs text-blue-700 uppercase tracking-widest font-semibold mb-2">Quartier</p>
                    <p className="text-2xl font-bold text-slate-800">{collecte.quartier || '-'}</p>
                  </div>

                  <div className="border-b-2 border-blue-200 pb-6">
                    <p className="text-xs text-blue-700 uppercase tracking-widest font-semibold mb-2">Section</p>
                    <p className="text-2xl font-bold text-slate-800">{collecte.section || '-'}</p>
                  </div>

                  <div className="pb-6">
                    <p className="text-xs text-blue-700 uppercase tracking-widest font-semibold mb-2">Propriétaire</p>
                    <p className="text-2xl font-bold text-slate-800">{getProprietaireName(collecte)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Section 
            title="INFORMATIONS SUR LA PARCELLE" 
            isNewCollecte={true}
            sectionNumber={1}
          >
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-2 sm:border-l-4 border-blue-800 p-3 sm:p-6 rounded section-localisation">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Localisation du bien</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Commune</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.commune || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Section</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.section || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Parcelle</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.parcelle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Quartier</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.quartier || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Lot</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.lot || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Îlot</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.ilot || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Surface (m²)</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.surface_imposable || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Référence DGI</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.reference_dgi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Code exemption</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.code_exemption || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Année ACQ</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.annee_acq || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Nature</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.nature || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Valeur vénale</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.valeur_venale || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Code VV</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.code_vv || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Code quartier</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.code_quartier || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">T.F.</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.tf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">N° Appart.</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.num_appartement || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Niveau appart.</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.niveau_appartement || '-'}</p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 uppercase tracking-wide">Position GPS (WGS 84) - Latitude (Y)</p>
                     <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.latitude || '-'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-wide">Position GPS (WGS 84) - Longitude (X)</p>
                     <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.longitude || '-'}</p>
                   </div>
                  </div>
                  </div>
                  </div>
                  </Section>

          {/* Propriétaire */}
          <Section 
            title={`PROPRIÉTAIRE${collecte.type_proprietaire === 'societe' ? ' (SOCIÉTÉ)' : ' (PARTICULIER)'}`} 
            className="section-proprietaire"
            sectionNumber={2}
          >
            <div className="space-y-8">
              {collecte.type_proprietaire === 'particulier' && (
                <>
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Identité du propriétaire</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nom</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_nom || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Prénoms</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_prenoms || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Date naissance</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_date_naissance || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Lieu naissance</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_lieu_naissance || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Sous-Préfecture</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_sous_prefecture || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Pays</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_pays || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Carte identité</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.prop_carte_identite || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nationalité</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_nationalite || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Autre pièce</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_autre_piece || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Autre pièce</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_autre_piece_numero || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Compte contrib.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.prop_compte_contribuable || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nom du père</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_nom_pere || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nom de la mère</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_nom_mere || '-'}</p>
                      </div>
                    </div>
                  </div>
                  {(collecte.prop_photo_carte_identite_recto || collecte.prop_photo_carte_identite_verso) && (
                    <div className="section-photos">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3 pb-1 border-b border-slate-300">Pièce d'Identité</h3>
                      <PhotoIdGrid 
                        photos={[collecte.prop_photo_carte_identite_recto, collecte.prop_photo_carte_identite_verso]}
                        labels={['Recto', 'Verso']}
                      />
                    </div>
                  )}
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Adresse de résidence</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Adresse postale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_adresse_postale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">B.P.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_bp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Ville</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_ville || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Quartier</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_quartier_residence || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_tel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">T.F.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_adresse_tf || '-'}</p>
                      </div>
                    </div>
                    {collecte.prop_infos_complementaires && (
                      <div className="mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-slate-300">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Informations complémentaires</p>
                        <p className="text-sm text-slate-800">{collecte.prop_infos_complementaires}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Situation de famille</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Situation familiale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.situation_familiale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre d'enfants à charge</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.nombre_enfants || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Adresse professionnelle</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Profession</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_profession || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Service/Employeur</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_service_employeur || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Adresse postale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_adresse_postale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">B.P.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_bp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Ville</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_ville || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Quartier</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_quartier || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prof_tel || '-'}</p>
                      </div>
                    </div>
                    </div>
                    {/* Signature Propriétaire Particulier */}
                    <div className="signature-box">
                      <h3 className="font-bold text-sm sm:text-base text-blue-900 mb-4 pb-3 border-b-2 border-blue-800">Attestation du propriétaire</h3>
                      <div className="text-xs sm:text-sm text-slate-700 mb-6 p-4 bg-white rounded-lg border-l-4 border-blue-800 italic">
                        <p>« Je certifie sur l'honneur que les informations ci-dessus sont véritables et exactes. »</p>
                      </div>
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 font-semibold mb-2">Date</p>
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              <p className="text-sm sm:text-base font-bold text-slate-800">{safeFormat(collecte.prop_signature_date, 'dd/MM/yyyy', { locale: fr })}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 font-semibold mb-2">Nom et prénoms</p>
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.prop_signature || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 font-semibold mb-2">Signature</p>
                          <div className="border-2 border-blue-800 rounded-lg bg-white flex items-center justify-center p-4" style={{height: '140px'}}>
                            {collecte.prop_photo_signature ? (
                              <img src={collecte.prop_photo_signature} alt="Signature" className="max-w-full max-h-full object-contain" loading="lazy" />
                            ) : (
                              <div className="text-slate-300 text-sm">Signature non disponible</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    </>
                    )}
                    {collecte.type_proprietaire === 'societe' && (
                <>
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Informations sur la société</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nom ou Raison Sociale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_raison_sociale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Registre Commerce</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.societe_registre_commerce || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Compte contribuable</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.societe_compte_contribuable || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Adresse postale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_adresse_postale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">B.P.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_bp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Ville</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_ville || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Quartier</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_quartier || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_tel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Îlot</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_ilot || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Lot</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_lot || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">T.F.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_tf || '-'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Signature Propriétaire Société */}
                  <div className="signature-box">
                    <h3 className="font-bold text-sm sm:text-base text-blue-900 mb-4 pb-3 border-b-2 border-blue-800">Attestation du représentant de la société</h3>
                    <div className="text-xs sm:text-sm text-slate-700 mb-6 p-4 bg-white rounded-lg border-l-4 border-blue-800 italic">
                      <p>« Je certifie sur l'honneur que les informations ci-dessus sont véritables et exactes. »</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="flex-1">
                          <p className="text-xs text-blue-700 font-semibold mb-2">Date</p>
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <p className="text-sm sm:text-base font-bold text-slate-800">{safeFormat(collecte.societe_signature_date || collecte.prop_signature_date, 'dd/MM/yyyy', { locale: fr })}</p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-700 font-semibold mb-2">Nom et prénoms du représentant</p>
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.societe_signature || collecte.prop_signature || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-semibold mb-2">Signature</p>
                        <div className="border-2 border-blue-800 rounded-lg bg-white flex items-center justify-center p-4" style={{height: '140px'}}>
                          {(collecte.societe_photo_signature || collecte.prop_photo_signature) ? (
                            <img src={collecte.societe_photo_signature || collecte.prop_photo_signature} alt="Signature" className="max-w-full max-h-full object-contain" loading="lazy" />
                          ) : (
                            <div className="text-slate-300 text-sm">Signature non disponible</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

              {/* Gestion du bien */}
              {collecte.gestion_par_agence && (
                <Section title="GESTION DU BIEN" className="section-gestion" sectionNumber={3}>
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Informations sur l'agence</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Raison Sociale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_raison_sociale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">N° Compte contribuable</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.agence_compte_contribuable || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Adresse postale</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_adresse_postale || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">B.P.</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_bp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Ville</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_ville || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Quartier</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_quartier || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.agence_tel || '-'}</p>
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              {/* Bien */}
              <Section title="DESCRIPTION DU BIEN" className="section-bien" sectionNumber={collecte.gestion_par_agence ? 4 : 3}>
                <div className="space-y-8">
                  <div className="bg-blue-50 p-3 sm:p-6 rounded border-l-2 sm:border-l-4 border-blue-800 info-block">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Caractéristiques du bien</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nature du local</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{getNatureLocalLabel(collecte.bien_nature_local)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Année achèvement</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_annee_achevement || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Équipé en eau</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_equipe_eau ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Équipé en électricité</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_equipe_electricite ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre niveaux</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_nombre_niveaux || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre bâtiments</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_nombre_batiments || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nombre pièces</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.bien_nombre_pieces || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nature occupation</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800">{getNatureOccupationLabel(collecte.bien_nature_occupation)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Valeur loc. mensuelle</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 break-all">{collecte.bien_valeur_locative_mensuelle ? `${collecte.bien_valeur_locative_mensuelle} FCFA` : '-'}</p>
                      </div>
                    </div>
                  </div>
              {(collecte.bien_photo_facade || collecte.bien_photo_entree || collecte.bien_photo_general) && (
                <div className="section-photos">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3 pb-1 border-b border-slate-300">Photos de l'Immeuble</h3>
                  <PhotoBuildingGrid 
                    photos={[collecte.bien_photo_facade, collecte.bien_photo_entree, collecte.bien_photo_general]}
                    labels={['Façade', 'Entrée', 'Vue générale']}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Tableau de Synthèse */}
          {collecte.tableau_synthese && collecte.tableau_synthese.length > 0 && (
            <Section title="TABLEAU DE SYNTHÈSE" isNewCollecte={false} className="section-synthese" sectionNumber={collecte.gestion_par_agence ? 5 : 4}>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-800 text-white">
                      <th className="border border-slate-300 p-2 sm:p-3 text-left text-xs sm:text-sm font-bold">N°</th>
                      <th className="border border-slate-300 p-2 sm:p-3 text-left text-xs sm:text-sm font-bold">Année</th>
                      <th className="border border-slate-300 p-2 sm:p-3 text-left text-xs sm:text-sm font-bold">Nature occupation</th>
                      <th className="border border-slate-300 p-2 sm:p-3 text-right text-xs sm:text-sm font-bold">Valeur (FCFA)</th>
                      <th className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm font-bold">Pièces</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collecte.tableau_synthese.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-slate-300 p-2 sm:p-3 font-semibold text-slate-600">{index + 1}</td>
                        <td className="border border-slate-300 p-2 sm:p-3">{row.annee_achevement || '-'}</td>
                        <td className="border border-slate-300 p-2 sm:p-3">{getNatureOccupationLabel(row.nature_occupation)}</td>
                        <td className="border border-slate-300 p-2 sm:p-3 text-right font-semibold">{row.valeur_locative_annuelle ? row.valeur_locative_annuelle.toLocaleString('fr-FR') : '-'}</td>
                        <td className="border border-slate-300 p-2 sm:p-3 text-center">{row.nombre_pieces || '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-slate-300 p-2 sm:p-3" colSpan="3">TOTAL</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-right text-blue-900">
                        {collecte.tableau_synthese.reduce((sum, row) => sum + (row.valeur_locative_annuelle || 0), 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-blue-900">
                        {collecte.tableau_synthese.reduce((sum, row) => sum + (row.nombre_pieces || 0), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Signature */}
          <Section title="CERTIFICATION DE L'AGENT RECENSEUR" isNewCollecte={false} className="section-signature page-break-inside-avoid" sectionNumber={
            (collecte.gestion_par_agence ? 1 : 0) + 
            (collecte.tableau_synthese && collecte.tableau_synthese.length > 0 ? 1 : 0) + 
            4
          }>
            <div className="signature-box">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-800">
                  <p className="text-xs text-blue-700 font-semibold mb-2">Date de collecte</p>
                  <p className="text-base font-bold text-slate-800">
                    {safeFormat(collecte.date_collecte, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-800">
                  <p className="text-xs text-blue-700 font-semibold mb-2">Agent recenseur</p>
                  <p className="text-base font-bold text-slate-800">{collecte.signature_agent || '-'}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-slate-300">
                <p className="text-xs text-blue-700 font-semibold mb-2">Signature et cachet</p>
                <div className="border-2 border-blue-800 rounded-lg bg-white flex items-center justify-center p-4" style={{height: '180px'}}>
                  {collecte.signature_agent_photo ? (
                    <img src={collecte.signature_agent_photo} alt="Signature agent" className="max-w-full max-h-full object-contain" loading="lazy" />
                  ) : (
                    <div className="text-slate-300 text-sm">Signature non disponible</div>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </div>
      ))}
    </div>
  );
}