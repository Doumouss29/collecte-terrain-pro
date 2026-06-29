import React from 'react';

export default function CollecteCoverPage({ collecte }) {
  const getProprietaireName = () => {
    if (collecte.type_proprietaire === 'societe') {
      return collecte.societe_raison_sociale || '-';
    }
    const nom = collecte.prop_nom || '';
    const prenoms = collecte.prop_prenoms || '';
    return [prenoms, nom].filter(Boolean).join(' ') || '-';
  };

  return (
    <div className="hidden print:block print:page-break-after print:w-full print:h-screen print:flex print:flex-col print:justify-between print:items-center print:bg-white print:p-8">
      <style>{`
        @media print {
          .cover-page { 
            page-break-after: always; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }
      `}</style>
      
      <div className="cover-page w-full max-w-3xl flex flex-col justify-between" style={{ minHeight: '100vh' }}>
        <div>
          {/* Header Ministère */}
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-slate-700 tracking-wide">MINISTÈRE DE L'ÉCONOMIE</p>
            <p className="text-sm font-semibold text-slate-700 tracking-wide">ET DES FINANCES</p>
            
            <div className="border-t-2 border-b-2 border-slate-400 my-3 py-2">
              <p className="text-xs font-bold text-slate-800">DIRECTION GÉNÉRALE DES IMPÔTS</p>
              <p className="text-xs font-bold text-slate-800">DIRECTION DU CADASTRE</p>
            </div>
          </div>

          {/* Titre Principal */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">OPÉRATION DE RECENSEMENT</h1>
            <h2 className="text-2xl font-bold text-slate-800">DES PROPRIÉTAIRES FONCIERS</h2>
          </div>

          {/* Infos Clés */}
          <div className="bg-blue-800 border-2 border-blue-900 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-blue-200 font-semibold mb-1">Commune</p>
                <p className="text-lg font-bold text-white">{collecte.commune || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 font-semibold mb-1">Section</p>
                <p className="text-lg font-bold text-white">{collecte.section || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-blue-200 font-semibold mb-1">Parcelle</p>
                <p className="text-lg font-bold text-white">{collecte.parcelle || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 font-semibold mb-1">Propriétaire</p>
                <p className="text-lg font-bold text-white">{getProprietaireName()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date du Rapport */}
        <div className="text-center pb-8">
          <p className="text-sm text-slate-600">
            Rapport généré le {new Date().toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>


      </div>
    </div>
  );
}