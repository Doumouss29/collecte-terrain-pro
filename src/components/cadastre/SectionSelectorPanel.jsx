import React, { useState, useMemo, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Map, ChevronDown, ChevronRight, Search, AlertTriangle, Loader2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

function normalizeText(value) {
  return String(value == null ? '' : value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

// Clé de stockage local par utilisateur
function getStorageKey(userId, organisationId) {
  return `cadastre_sections_${userId || 'guest'}_${organisationId || ''}`;
}

function loadSavedSections(userId, organisationId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, organisationId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSections(userId, organisationId, sectionIds) {
  try {
    localStorage.setItem(getStorageKey(userId, organisationId), JSON.stringify(sectionIds));
  } catch {}
}

export default function SectionSelectorPanel({
  organisationId,
  commune,
  userId,
  selectedSectionIds,
  onSelectionChange,
  allSectionsMeta, // optionnel : données déjà chargées par le parent
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showAllWarning, setShowAllWarning] = useState(false);
  const initializedRef = useRef(false);

  // Charger la liste des sections (métadonnées uniquement, pas les GeoJSON)
  // Si allSectionsMeta est fourni par le parent, on l'utilise directement
  const { data: fetchedSections = [], isLoading } = useQuery({
    queryKey: ['cadastre-meta', organisationId, commune],
    queryFn: async () => {
      const all = await base44.entities.CadastreCommunal.filter(
        { organisation_id: organisationId },
        '-created_date',
        1000
      );
      return all.filter((s) => normalizeText(s.commune) === normalizeText(commune));
    },
    enabled: !!organisationId && !!commune && !allSectionsMeta?.length,
    staleTime: 5 * 60 * 1000,
  });
  const allSections = allSectionsMeta?.length ? allSectionsMeta : fetchedSections;

  // Restaurer la sélection sauvegardée au premier chargement
  useEffect(() => {
    if (initializedRef.current) return;
    if (!allSections.length) return;
    initializedRef.current = true;

    const saved = loadSavedSections(userId, organisationId);
    if (saved && saved.length > 0) {
      // Garder uniquement les IDs qui existent encore
      const validIds = saved.filter((id) => allSections.some((s) => s.id === id));
      if (validIds.length > 0) {
        onSelectionChange(validIds);
        return;
      }
    }
    // Aucune sauvegarde : pas de sélection automatique
    onSelectionChange([]);
  }, [allSections, userId, organisationId]);

  // Persister la sélection à chaque changement
  useEffect(() => {
    if (!initializedRef.current) return;
    saveSections(userId, organisationId, selectedSectionIds);
  }, [selectedSectionIds, userId, organisationId]);

  const selectedCount = selectedSectionIds.length;
  const selectedParcelles = useMemo(
    () =>
      allSections
        .filter((s) => selectedSectionIds.includes(s.id))
        .reduce((sum, s) => sum + (s.nombre_parcelles || 0), 0),
    [allSections, selectedSectionIds]
  );

  const toggleSection = (id) => {
    const next = selectedSectionIds.includes(id)
      ? selectedSectionIds.filter((x) => x !== id)
      : [...selectedSectionIds, id];
    onSelectionChange(next);
  };

  const selectAll = () => {
    onSelectionChange(allSections.map((s) => s.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  const handleShowAll = () => {
    setShowAllWarning(true);
  };

  const confirmShowAll = () => {
    onSelectionChange(allSections.map((s) => s.id));
    setShowAllWarning(false);
    setIsOpen(false);
  };

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{ pointerEvents: 'auto', zIndex: 1000, marginTop: '140px', marginRight: '8px' }}
    >
      <div className="leaflet-control" style={{ position: 'relative' }}>
        {/* Bouton toggle */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          title="Sélectionner les sections cadastrales"
          style={{
            background: selectedCount > 0 ? '#eff6ff' : 'white',
            border: `2px solid ${selectedCount > 0 ? '#2563eb' : 'rgba(0,0,0,0.2)'}`,
            borderRadius: '4px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: selectedCount > 0 ? '#2563eb' : '#374151',
          }}
        >
          <Map size={18} />
          <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Sections</span>
          {selectedCount > 0 && (
            <span style={{
              background: '#2563eb', color: 'white', borderRadius: '9999px',
              padding: '1px 5px', fontSize: '10px', lineHeight: '1.4',
            }}>
              {selectedCount}
            </span>
          )}
        </button>

        {/* Panneau déroulant */}
        {isOpen && (
          <div
            className="absolute top-full right-0 mt-1 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            style={{ zIndex: 9999, touchAction: 'pan-y' }}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="bg-blue-900 text-white px-3 py-2.5">
              <p className="font-bold text-sm">{commune}</p>
              <p className="text-xs text-blue-300">
                {allSections.length} section{allSections.length > 1 ? 's' : ''} disponible{allSections.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 hover:underline transition-colors font-medium"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Tout cocher
                </button>
                <span className="text-slate-300 mx-1">|</span>
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 hover:underline transition-colors font-medium"
                >
                  <Square className="w-3.5 h-3.5" /> Tout décocher
                </button>
              </div>
            </div>

            {/* Liste des sections */}
            <div className="max-h-64 overflow-y-auto" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : allSections.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Aucune section trouvée</p>
              ) : (
                allSections.map((section) => {
                  const isSelected = selectedSectionIds.includes(section.id);
                  return (
                    <label
                      key={section.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSection(section.id)}
                        className="accent-blue-600 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{section.nom_section}</p>
                        <p className="text-[10px] text-slate-400">
                          {(section.nombre_parcelles || 0).toLocaleString()} parcelle{section.nombre_parcelles > 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Pied de panneau */}
            <div className="border-t border-slate-100 px-3 py-2 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}