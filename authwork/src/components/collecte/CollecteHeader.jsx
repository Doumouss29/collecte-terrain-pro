import React from 'react';
import { MapPin, User } from 'lucide-react';

export default function CollecteHeader({ collecte }) {
  const getProprietaireName = () => {
    if (collecte.type_proprietaire === 'societe') {
      return collecte.societe_raison_sociale || '-';
    }
    const nom = collecte.prop_nom || '';
    const prenoms = collecte.prop_prenoms || '';
    return [prenoms, nom].filter(Boolean).join(' ') || '-';
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 sm:p-6 print:p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium">Commune</p>
          <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.commune || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Section</p>
          <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.section || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Parcelle</p>
          <p className="text-sm sm:text-base font-bold text-slate-800">{collecte.parcelle || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-slate-500 font-medium">Propriétaire</p>
          <p className="text-sm sm:text-base font-bold text-slate-800">{getProprietaireName()}</p>
        </div>
      </div>
    </div>
  );
}