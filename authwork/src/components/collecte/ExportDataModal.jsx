import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, CheckSquare, Square, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ExportDataModal({ isOpen, onClose, collectes }) {
  const [selectedCommune, setSelectedCommune] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const availableCommunes = useMemo(() => {
    const communes = new Set((collectes || []).map(c => c.commune).filter(Boolean));
    return [...communes].sort();
  }, [collectes]);

  const filtered = useMemo(() => {
    return (collectes || []).filter(c => {
      const matchCommune = !selectedCommune || c.commune === selectedCommune;
      const createdDate = c.created_date ? new Date(c.created_date) : null;
      const matchFrom = !dateFrom || (createdDate && createdDate >= new Date(dateFrom));
      const matchTo = !dateTo || (createdDate && createdDate <= new Date(dateTo + 'T23:59:59'));
      return matchCommune && matchFrom && matchTo;
    });
  }, [collectes, selectedCommune, dateFrom, dateTo]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(c => c.id));
    }
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error('Veuillez sélectionner au moins un rapport');
      return;
    }
    setIsExporting(true);
    setProgress({ current: 0, total: selected.length });

    try {
      const zip = new JSZip();
      const toExport = collectes.filter(c => selected.includes(c.id));
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < toExport.length; i++) {
        const collecte = toExport[i];
        setProgress({ current: i + 1, total: toExport.length });

        try {
          const response = await base44.functions.invoke('exportCollectePdf', { collecteId: collecte.id });
          const data = response.data;

          if (data?.success && data?.file) {
            // Decode base64 to binary
            const binaryStr = atob(data.file);
            const bytes = new Uint8Array(binaryStr.length);
            for (let j = 0; j < binaryStr.length; j++) {
              bytes[j] = binaryStr.charCodeAt(j);
            }

            const safeName = `${collecte.commune || 'commune'}_${collecte.section || 'section'}_${collecte.parcelle || 'parcelle'}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
            zip.file(`${safeName}.pdf`, bytes);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Erreur pour collecte ${collecte.id}:`, err);
          errorCount++;
        }
      }

      if (successCount === 0) {
        toast.error('Aucun PDF n\'a pu être généré');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `rapports_pdf_${format(new Date(), 'yyyy-MM-dd')}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

      if (errorCount > 0) {
        toast.warning(`${successCount} PDF(s) exporté(s), ${errorCount} erreur(s)`);
      } else {
        toast.success(`${successCount} rapport(s) PDF exporté(s) avec succès`);
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isExporting ? undefined : onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-800" />
            Exporter des rapports PDF (ZIP)
          </DialogTitle>
        </DialogHeader>

        {/* Filtres */}
        <div className="space-y-3 pb-3 border-b">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Date de début</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Date de fin</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          {availableCommunes.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Filtrer par commune</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCommune('')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    !selectedCommune ? 'bg-blue-800 text-white border-blue-800' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  Toutes ({(collectes || []).length})
                </button>
                {availableCommunes.map(commune => {
                  const count = (collectes || []).filter(c => c.commune === commune).length;
                  return (
                    <button
                      key={commune}
                      onClick={() => setSelectedCommune(prev => prev === commune ? '' : commune)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selectedCommune === commune
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {commune} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sélection tout */}
        <div className="flex items-center justify-between text-sm">
          <button onClick={toggleAll} className="flex items-center gap-2 text-blue-800 hover:underline">
            {selected.length === filtered.length && filtered.length > 0
              ? <CheckSquare className="w-4 h-4" />
              : <Square className="w-4 h-4" />
            }
            Tout sélectionner ({filtered.length})
          </button>
          <span className="text-slate-500">{selected.length} sélectionné(s)</span>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">Aucun rapport trouvé</p>
          )}
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => !isExporting && toggleSelect(c.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected.includes(c.id)
                  ? 'border-blue-800 bg-blue-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              {selected.includes(c.id)
                ? <CheckSquare className="w-5 h-5 text-blue-800 flex-shrink-0" />
                : <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm">
                  {c.commune || '—'} — Parcelle {c.parcelle || '—'}
                  {c.section ? ` / Section ${c.section}` : ''}
                </div>
                <div className="text-xs text-slate-500">
                  {c.type_proprietaire === 'particulier'
                    ? `${c.prop_nom || ''} ${c.prop_prenoms || ''}`.trim() || '—'
                    : c.societe_raison_sociale || '—'
                  } • {c.created_date ? format(new Date(c.created_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                </div>
              </div>
              <FileText className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {isExporting && progress.total > 0 && (
          <div className="pt-2 pb-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Génération des PDFs...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-800 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>Annuler</Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selected.length === 0}
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            {isExporting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</>
              : <><Download className="w-4 h-4 mr-2" /> Exporter {selected.length > 0 ? `${selected.length} PDF(s)` : ''} ZIP</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}