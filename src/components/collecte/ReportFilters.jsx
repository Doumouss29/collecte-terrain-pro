import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';

export default function ReportFilters({ collectes, onFilter, onPrint }) {
  const [filters, setFilters] = useState({ section: '', quartier: '', nature: '' });

  const getAvailableSections = () => {
    const sections = new Set(collectes?.map(c => c.section).filter(Boolean));
    return [...sections].sort();
  };

  const getAvailableQuartiers = () => {
    const quartiers = new Set(collectes?.map(c => c.quartier).filter(Boolean));
    return [...quartiers].sort();
  };

  const getAvailableNatures = () => {
    const natures = new Set(collectes?.map(c => c.nature).filter(Boolean));
    return [...natures].sort();
  };

  const getNatureLabel = (nature) => {
    if (!nature) return '';
    if (nature === 'batie') return 'BÂTIE';
    if (nature === 'non_batie') return 'NON BÂTIE';
    return nature.toUpperCase();
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (f) => {
    onFilter(collectes?.filter(c => {
      const matchSection = !f.section || c.section === f.section;
      const matchQuartier = !f.quartier || c.quartier === f.quartier;
      const matchNature = !f.nature || c.nature === f.nature;
      return matchSection && matchQuartier && matchNature;
    }) || []);
  };

  const clearFilters = () => {
    setFilters({ section: '', quartier: '', nature: '' });
    onFilter(collectes);
  };

  const hasActiveFilters = filters.section || filters.quartier || filters.nature;

  return (
    <Card className="border-0 shadow-md mb-6 print-hide">
      <CardContent className="p-4">
        <div className="flex justify-center mb-4">
          {onPrint && (
            <Button
              onClick={onPrint}
              className="bg-gray-100 text-slate-900 hover:bg-gray-200 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-base font-medium border border-slate-300"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quartier</label>
            <select
              value={filters.quartier}
              onChange={(e) => handleFilterChange('quartier', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
            >
              <option value="">Tous les quartiers</option>
              {getAvailableQuartiers().map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
            >
              <option value="">Toutes les sections</option>
              {getAvailableSections().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nature</label>
            <select
              value={filters.nature}
              onChange={(e) => handleFilterChange('nature', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
            >
              <option value="">Toutes les natures</option>
              {getAvailableNatures().map(n => (
                <option key={n} value={n}>{getNatureLabel(n)}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}