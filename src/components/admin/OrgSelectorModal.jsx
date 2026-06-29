import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Loader2 } from 'lucide-react';

export default function OrgSelectorModal({ isOpen, onClose, onSelect, title = "Organisation" }) {
  const { data: organisations = [], isLoading } = useQuery({
    queryKey: ['organisations-selector'],
    queryFn: () => base44.entities.Organisation.list(),
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {organisations.map(org => (
              <button
                key={org.id}
                onClick={() => { onSelect(org); onClose(); }}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-blue-900">{org.nom}</p>
                    {org.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{org.description}</p>
                    )}
                  </div>

                </div>
              </button>
            ))}
            {organisations.length === 0 && (
              <p className="text-center text-slate-500 py-6">Aucune organisation disponible</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}