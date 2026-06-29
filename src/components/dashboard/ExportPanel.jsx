import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Map, FileText, Loader2, FileSpreadsheet } from 'lucide-react';
import { collectesToGeoJSON, downloadGeoJSON } from '@/utils/geoJsonExport';

/**
 * Convertit un tableau de collectes en CSV et le télécharge
 */
function collectesToCSV(collectes, filename) {
  if (!collectes.length) return;

  const fields = [
    'id', 'commune', 'section', 'parcelle', 'lot', 'ilot', 'quartier',
    'reference_dgi', 'statut', 'date_collecte',
    'type_proprietaire',
    'prop_nom', 'prop_prenoms', 'prop_tel', 'prop_carte_identite',
    'societe_raison_sociale', 'societe_registre_commerce', 'societe_tel',
    'bien_nature_local', 'bien_nature_occupation', 'bien_nombre_niveaux',
    'bien_nombre_batiments', 'bien_nombre_pieces', 'bien_valeur_locative_mensuelle',
    'bien_annee_achevement', 'bien_equipe_eau', 'bien_equipe_electricite',
    'surface_imposable', 'valeur_venale',
    'latitude', 'longitude',
    'signature_agent', 'created_date',
  ];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = fields.join(',');
  const rows = collectes.map(c => fields.map(f => escape(c[f])).join(','));
  const csv = [header, ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = filename || `collectes_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportPanel({ collectes, commune, dateLabel }) {
  const [exportingGeoJson, setExportingGeoJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const count = collectes?.length || 0;

  // Construit un nom de fichier : COMMUNE_periode (sans espaces ni caractères spéciaux)
  const buildFilename = (ext) => {
    const cleanCommune = (commune || 'export').toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const cleanPeriode = (dateLabel || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return cleanPeriode ? `${cleanCommune}_${cleanPeriode}.${ext}` : `${cleanCommune}.${ext}`;
  };

  const handleExportGeoJson = () => {
    setExportingGeoJson(true);
    try {
      const geoJson = collectesToGeoJSON(collectes);
      downloadGeoJSON(geoJson, buildFilename('geojson'));
    } finally {
      setExportingGeoJson(false);
    }
  };

  const handleExportCsv = () => {
    setExportingCsv(true);
    try {
      collectesToCSV(collectes, buildFilename('csv'));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Exports SIG</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {count} collecte{count > 1 ? 's' : ''} filtrée{count > 1 ? 's' : ''}
            {commune ? ` · ${commune}` : ''}
            {dateLabel ? ` · ${dateLabel}` : ''}
          </p>
        </div>
        <div className="text-3xl font-bold text-blue-700">{count}</div>
      </div>

      {count === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-4">
          Aucune collecte pour les filtres sélectionnés
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* GeoJSON */}
          <button
            onClick={handleExportGeoJson}
            disabled={exportingGeoJson}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200">
              {exportingGeoJson
                ? <Loader2 className="w-5 h-5 text-purple-700 animate-spin" />
                : <Map className="w-5 h-5 text-purple-700" />
              }
            </div>
            <div>
              <p className="font-bold text-slate-800">GeoJSON</p>
              <p className="text-xs text-slate-500">Format SIG · QGIS, ArcGIS, MapInfo</p>
            </div>
          </button>

          {/* CSV */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200">
              {exportingCsv
                ? <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
                : <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              }
            </div>
            <div>
              <p className="font-bold text-slate-800">CSV</p>
              <p className="text-xs text-slate-500">Tableur · Excel, Calc, Google Sheets</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}