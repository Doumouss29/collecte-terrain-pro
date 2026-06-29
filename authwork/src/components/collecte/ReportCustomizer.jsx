import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, Download } from 'lucide-react';

export default function ReportCustomizer({ onExport }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('commune');

  const handleExport = () => {
    onExport(groupBy);
    setIsOpen(false);
  };

  const groupOptions = [
    { value: 'commune', label: 'Par Commune' },
    { value: 'date', label: 'Par Date' },
    { value: 'proprietaire', label: 'Par Propriétaire' }
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="border-blue-800 text-blue-800 hover:bg-blue-50"
      >
        <Settings2 className="w-4 h-4 mr-2" />
        Grouper par
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-72 border-blue-200 shadow-xl z-50">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Organiser le rapport par</h3>
              <div className="space-y-2">
                {groupOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <input
                      type="radio"
                      name="groupBy"
                      value={option.value}
                      checked={groupBy === option.value}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleExport}
                className="flex-1 bg-blue-800 hover:bg-blue-900"
              >
                <Download className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}