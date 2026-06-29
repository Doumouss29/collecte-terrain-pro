import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Loader2, FileJson, Trash2, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import CadastreUploadDialog from './CadastreUploadDialog';

export default function CadastreManagerDialog({ isOpen, onClose, organisation }) {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['cadastre', organisation?.id],
    queryFn: () => base44.entities.CadastreCommunal.filter({ organisation_id: organisation.id }),
    enabled: !!organisation?.id && isOpen,
  });

  const handleDelete = async (section) => {
    if (!confirm(`Supprimer la section "${section.nom_section}" (${section.commune}) ?`)) return;
    try {
      // Vider le cache local
      localStorage.removeItem(`cadastre_geojson_${section.id}`);
      await base44.entities.CadastreCommunal.delete(section.id);
      queryClient.invalidateQueries({ queryKey: ['cadastre', organisation?.id] });
      toast.success('Section supprimée');
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Grouper par commune
  const byCommune = sections.reduce((acc, s) => {
    if (!acc[s.commune]) acc[s.commune] = [];
    acc[s.commune].push(s);
    return acc;
  }, {});

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-green-700" />
              Données cadastrales — {organisation?.nom}
            </DialogTitle>
            <DialogDescription>
              Gérez les sections cadastrales GeoJSON disponibles pour cette organisation
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-2">
            <Button
              className="bg-green-700 hover:bg-green-800 text-white"
              onClick={() => setIsUploadOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Importer une section
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-700" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileJson className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p>Aucune section cadastrale importée</p>
              <p className="text-sm mt-1">Cliquez sur "Importer une section" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(byCommune).map(([commune, secs]) => (
                <div key={commune}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <span className="font-semibold text-slate-800">{commune}</span>
                    <span className="text-xs text-slate-500">({secs.length} section{secs.length > 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {secs.map(sec => (
                      <div key={sec.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border">
                        <div>
                          <span className="font-medium text-sm text-slate-800">{sec.nom_section}</span>
                          {sec.nombre_parcelles && (
                            <span className="ml-2 text-xs text-slate-500">{sec.nombre_parcelles} parcelles</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sec)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CadastreUploadDialog
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['cadastre', organisation?.id] });
        }}
        organisation={organisation}
      />
    </>
  );
}