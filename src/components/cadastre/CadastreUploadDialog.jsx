import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Loader2, Upload, FileJson } from 'lucide-react';
import { toast } from 'sonner';

export default function CadastreUploadDialog({ isOpen, onClose, organisation }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [nomSection, setNomSection] = useState('');
  const [commune, setCommune] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const communeOptions = organisation?.communes || [];

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    // Essayer d'auto-détecter le nom de section depuis le nom du fichier
    const baseName = f.name.replace('.geojson', '').replace('.json', '');
    if (!nomSection) setNomSection(baseName.toUpperCase());
  };

  const handleUpload = async () => {
    if (!file || !nomSection || !commune) {
      toast.error('Veuillez remplir tous les champs et sélectionner un fichier');
      return;
    }
    setIsUploading(true);
    try {
      // Lire et valider le GeoJSON
      const text = await file.text();
      const geojson = JSON.parse(text);
      if (!geojson.type || !geojson.features) {
        toast.error('Fichier GeoJSON invalide');
        setIsUploading(false);
        return;
      }
      const nombreParcelles = geojson.features.length;

      // Uploader le fichier
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Créer l'enregistrement
      await base44.entities.CadastreCommunal.create({
        organisation_id: organisation.id,
        commune: commune.toUpperCase(),
        nom_section: nomSection.toUpperCase(),
        nombre_parcelles: nombreParcelles,
        geojson_url: file_url
      });

      queryClient.invalidateQueries({ queryKey: ['cadastre', organisation.id] });
      toast.success(`Section ${nomSection} importée (${nombreParcelles} parcelles)`);
      setFile(null);
      setNomSection('');
      setCommune('');
      onClose();
    } catch (err) {
      toast.error('Erreur lors de l\'import : ' + (err.message || ''));
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-700" />
            Importer une section cadastrale
          </DialogTitle>
          <DialogDescription>
            Uploadez un fichier GeoJSON contenant les parcelles d'une section
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Commune *</label>
            {communeOptions.length > 0 ? (
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={commune}
                onChange={e => setCommune(e.target.value)}
              >
                <option value="">Sélectionner une commune</option>
                {communeOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <Input
                value={commune}
                onChange={e => setCommune(e.target.value.toUpperCase())}
                placeholder="Nom de la commune"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Nom / Code section *</label>
            <Input
              value={nomSection}
              onChange={e => setNomSection(e.target.value.toUpperCase())}
              placeholder="ex: SECTION A, ZONE 1..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Fichier GeoJSON *</label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => document.getElementById('geojson-file-input').click()}
            >
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              {file ? (
                <p className="text-sm text-blue-700 font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-slate-500">Cliquer pour sélectionner un fichier .geojson</p>
              )}
              <input
                id="geojson-file-input"
                type="file"
                accept=".geojson,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleUpload} disabled={isUploading} className="bg-blue-800 hover:bg-blue-900">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}