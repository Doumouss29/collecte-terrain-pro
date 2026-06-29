import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ParcelEditModal({ parcelData, onSave, onClose }) {
  const [form, setForm] = useState({
    section: parcelData.section || '',
    parcelle: parcelData.parcelle || '',
    quartier: parcelData.quartier || '',
    lot: parcelData.lot || '',
    ilot: parcelData.ilot || '',
    surface: parcelData.surface || '',
  });

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fields = [
    { key: 'section', label: 'Section' },
    { key: 'parcelle', label: 'Parcelle' },
    { key: 'quartier', label: 'Quartier' },
    { key: 'lot', label: 'Lot' },
    { key: 'ilot', label: 'Îlot' },
    { key: 'surface', label: 'Superficie (m²)', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-80 p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base">Modifier la parcelle</h3>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {fields.map(({ key, label, type }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave(form)}>
            <Save size={14} className="mr-1" /> Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}