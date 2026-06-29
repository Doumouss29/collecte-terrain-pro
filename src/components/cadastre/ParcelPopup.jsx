import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { X, Bell } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ParcelPopup({ parcelData, onClose, onLeaveConvocation }) {
  const navigate = useNavigate();
  const [isSavingConvocation, setIsSavingConvocation] = useState(false);

  const handleStartSurvey = () => {
    const params = new URLSearchParams();
    params.set('source', 'carte');
    Object.entries(parcelData).forEach(([key, value]) => {
      if (value && key !== 'isConvocation') params.append(key, value);
    });
    navigate(`${createPageUrl('NouvelleCollecte')}?${params.toString()}`);
  };

  const handleLeaveConvocation = async () => {
    if (!onLeaveConvocation) return;
    setIsSavingConvocation(true);
    await onLeaveConvocation(parcelData);
    setIsSavingConvocation(false);
    onClose?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-80 relative overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <h3 className="font-bold text-slate-800">Informations de la parcelle</h3>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition"
          title="Fermer"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-4 pb-4 pt-3">
        {parcelData.isConvocation && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <Bell className="w-4 h-4" />
            Convocation laissée
          </div>
        )}
        <div className="space-y-2 text-sm">
          {parcelData.commune && (
            <div className="flex justify-between">
              <span className="text-slate-600">Commune :</span>
              <span className="font-semibold text-slate-800">{parcelData.commune}</span>
            </div>
          )}
          {parcelData.section && (
            <div className="flex justify-between">
              <span className="text-slate-600">Section :</span>
              <span className="font-semibold text-slate-800">{parcelData.section}</span>
            </div>
          )}
          {parcelData.parcelle && (
            <div className="flex justify-between">
              <span className="text-slate-600">Parcelle :</span>
              <span className="font-semibold text-slate-800">{parcelData.parcelle}</span>
            </div>
          )}
          {parcelData.quartier && (
            <div className="flex justify-between">
              <span className="text-slate-600">Quartier :</span>
              <span className="font-semibold text-slate-800">{parcelData.quartier}</span>
            </div>
          )}
          {parcelData.lot && (
            <div className="flex justify-between">
              <span className="text-slate-600">Lot :</span>
              <span className="font-semibold text-slate-800">{parcelData.lot}</span>
            </div>
          )}
          {parcelData.ilot && (
            <div className="flex justify-between">
              <span className="text-slate-600">Îlot :</span>
              <span className="font-semibold text-slate-800">{parcelData.ilot}</span>
            </div>
          )}
          {parcelData.surface && (
            <div className="flex justify-between">
              <span className="text-slate-600">Superficie :</span>
              <span className="font-semibold text-slate-800">{parcelData.surface} m²</span>
            </div>
          )}
          {parcelData.coordX && (
            <div className="flex justify-between">
              <span className="text-slate-600">Longitude X :</span>
              <span className="font-semibold text-slate-800">{parcelData.coordX}</span>
            </div>
          )}
          {parcelData.coordY && (
            <div className="flex justify-between">
              <span className="text-slate-600">Latitude Y :</span>
              <span className="font-semibold text-slate-800">{parcelData.coordY}</span>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {!parcelData.isConvocation && (
          <Button
            onClick={handleLeaveConvocation}
            disabled={isSavingConvocation}
            variant="outline"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {isSavingConvocation ? 'Enregistrement...' : 'Laisser une convocation'}
          </Button>
        )}
        <Button
          onClick={handleStartSurvey}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {parcelData.isConvocation ? 'Relancer le recensement' : 'Commencer le recensement'}
        </Button>
      </div>
    </div>
  );
}