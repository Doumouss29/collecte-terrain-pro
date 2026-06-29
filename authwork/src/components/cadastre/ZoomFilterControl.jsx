import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

function getField(props, key) {
  const k = Object.keys(props || {}).find(k => k.toUpperCase() === key.toUpperCase());
  return k ? (props[k] || '') : '';
}

// Highlight layer jaune sur les features correspondantes
function useHighlight(map, features) {
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }
    if (!features || features.length === 0) return;
    const layer = L.geoJSON({ type: 'FeatureCollection', features }, {
      style: {
        color: '#ca8a04',
        weight: 2.5,
        fillColor: '#fef08a',
        fillOpacity: 0.45,
      }
    }).addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
    };
  }, [map, features]);
}

function HighlightLayer({ features }) {
  const map = useMap();
  useHighlight(map, features);
  return null;
}

export function ZoomFilterControl({ geojsonDataList }) {
  const map = useMap();
  const [open, setOpen] = useState(false);

  // Sélections en cascade
  const [selectedQuartier, setSelectedQuartier] = useState('');
  const [selectedIlot, setSelectedIlot] = useState('');
  const [selectedLot, setSelectedLot] = useState('');

  // Étape active : 'quartier' | 'ilot' | 'lot'
  const [step, setStep] = useState('quartier');

  // Recherche
  const [search, setSearch] = useState('');

  const allFeatures = useMemo(() =>
    (geojsonDataList || []).flatMap(g => g.features || []),
    [geojsonDataList]
  );

  // --- Options disponibles selon l'étape ---
  const quartierOptions = useMemo(() => {
    const vals = new Set();
    allFeatures.forEach(f => {
      const v = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      if (v) vals.add(v);
    });
    return Array.from(vals).sort();
  }, [allFeatures]);

  const ilotOptions = useMemo(() => {
    const vals = new Set();
    allFeatures.forEach(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      if (selectedQuartier && q !== selectedQuartier) return;
      const v = getField(f.properties, 'ILOT') || '';
      if (v) vals.add(v);
    });
    return Array.from(vals).sort();
  }, [allFeatures, selectedQuartier]);

  const lotOptions = useMemo(() => {
    const vals = new Set();
    allFeatures.forEach(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      const ilot = getField(f.properties, 'ILOT') || '';
      if (selectedQuartier && q !== selectedQuartier) return;
      if (selectedIlot && ilot !== selectedIlot) return;
      const v = getField(f.properties, 'LOT') || '';
      if (v) vals.add(v);
    });
    return Array.from(vals).sort();
  }, [allFeatures, selectedQuartier, selectedIlot]);

  // Options courantes selon l'étape
  const currentOptions = step === 'quartier' ? quartierOptions : step === 'ilot' ? ilotOptions : lotOptions;
  const filteredOptions = useMemo(() =>
    currentOptions.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [currentOptions, search]
  );

  // --- Features à highlight ---
  const highlightFeatures = useMemo(() => {
    if (!selectedLot && !selectedIlot && !selectedQuartier) return [];
    return allFeatures.filter(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      const ilot = getField(f.properties, 'ILOT') || '';
      const lot = getField(f.properties, 'LOT') || '';
      if (selectedLot) return lot === selectedLot && (!selectedIlot || ilot === selectedIlot) && (!selectedQuartier || q === selectedQuartier);
      if (selectedIlot) return ilot === selectedIlot && (!selectedQuartier || q === selectedQuartier);
      return q === selectedQuartier;
    });
  }, [allFeatures, selectedQuartier, selectedIlot, selectedLot]);

  // --- Zoom sur un ensemble de features ---
  const zoomToFeatures = (features) => {
    if (!features.length) return;
    try {
      const layer = L.geoJSON({ type: 'FeatureCollection', features });
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {}
  };

  // --- Handlers de sélection ---
  const selectQuartier = (val) => {
    setSelectedQuartier(val);
    setSelectedIlot('');
    setSelectedLot('');
    setSearch('');
    // Zoom sur le quartier
    const features = allFeatures.filter(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      return q === val;
    });
    zoomToFeatures(features);
    // Passer à l'étape îlot si des îlots existent
    const hasIlots = features.some(f => getField(f.properties, 'ILOT'));
    setStep(hasIlots ? 'ilot' : 'quartier');
  };

  const selectIlot = (val) => {
    setSelectedIlot(val);
    setSelectedLot('');
    setSearch('');
    const features = allFeatures.filter(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      const ilot = getField(f.properties, 'ILOT') || '';
      if (selectedQuartier && q !== selectedQuartier) return false;
      return ilot === val;
    });
    zoomToFeatures(features);
    const hasLots = features.some(f => getField(f.properties, 'LOT'));
    setStep(hasLots ? 'lot' : 'ilot');
  };

  const selectLot = (val) => {
    setSelectedLot(val);
    setSearch('');
    const features = allFeatures.filter(f => {
      const q = getField(f.properties, 'QUARTIER') || getField(f.properties, 'COMMUNES') || '';
      const ilot = getField(f.properties, 'ILOT') || '';
      const lot = getField(f.properties, 'LOT') || '';
      if (selectedQuartier && q !== selectedQuartier) return false;
      if (selectedIlot && ilot !== selectedIlot) return false;
      return lot === val;
    });
    zoomToFeatures(features);
    setOpen(false);
  };

  const handleSelect = (val) => {
    if (step === 'quartier') selectQuartier(val);
    else if (step === 'ilot') selectIlot(val);
    else selectLot(val);
  };

  const reset = () => {
    setSelectedQuartier('');
    setSelectedIlot('');
    setSelectedLot('');
    setStep('quartier');
    setSearch('');
  };

  const stepLabel = { quartier: 'Quartier', ilot: 'Îlot', lot: 'Lot' }[step];
  const hasSelection = selectedQuartier || selectedIlot || selectedLot;

  // Breadcrumb label
  const breadcrumb = [
    selectedQuartier && `Q: ${selectedQuartier}`,
    selectedIlot && `Î: ${selectedIlot}`,
    selectedLot && `L: ${selectedLot}`,
  ].filter(Boolean).join(' › ');

  return (
    <>
      {highlightFeatures.length > 0 && <HighlightLayer features={highlightFeatures} />}
      <div
        className="leaflet-top leaflet-right"
        style={{ pointerEvents: 'auto', zIndex: 1000, marginTop: '96px', marginRight: '8px' }}
      >
        <div className="leaflet-control" style={{ position: 'relative' }}>
          <button
            onClick={() => { setOpen(o => !o); setSearch(''); }}
            title="Zoomer sur un quartier / îlot / lot"
            style={{
              background: hasSelection ? '#fefce8' : 'white',
              border: `2px solid ${hasSelection ? '#ca8a04' : 'rgba(0,0,0,0.2)'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 600,
              color: hasSelection ? '#ca8a04' : '#374151',
            }}
          >
            🔍
          </button>

          {open && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '210px',
              overflow: 'hidden',
            }}>
              {/* Header avec breadcrumb */}
              <div style={{ padding: '6px 10px', fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{breadcrumb || 'Zoomer sur…'}</span>
                {hasSelection && (
                  <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '11px', padding: '0 0 0 6px', fontWeight: 700 }}>✕</button>
                )}
              </div>

              {/* Steps tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                {['quartier', 'ilot', 'lot'].map((s, i) => {
                  const labels = { quartier: 'Quartier', ilot: 'Îlot', lot: 'Lot' };
                  const isActive = step === s;
                  const isDone = (s === 'quartier' && selectedQuartier) || (s === 'ilot' && selectedIlot) || (s === 'lot' && selectedLot);
                  const isDisabled = (s === 'ilot' && !selectedQuartier && ilotOptions.length === 0) || (s === 'lot' && !selectedIlot && lotOptions.length === 0);
                  return (
                    <button
                      key={s}
                      disabled={isDisabled}
                      onClick={() => { setStep(s); setSearch(''); }}
                      style={{
                        flex: 1,
                        padding: '5px 4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: isDisabled ? 'default' : 'pointer',
                        background: isActive ? '#fffbeb' : 'transparent',
                        color: isDisabled ? '#d1d5db' : isDone ? '#ca8a04' : isActive ? '#92400e' : '#6b7280',
                        borderBottom: isActive ? '2px solid #ca8a04' : '2px solid transparent',
                      }}
                    >
                      {isDone ? '✓ ' : ''}{labels[s]}
                    </button>
                  );
                })}
              </div>

              {/* Recherche */}
              <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder={`Chercher un ${stepLabel.toLowerCase()}…`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Liste */}
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredOptions.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: '#9ca3af' }}>Aucun résultat</div>
                )}
                {filteredOptions.map(val => {
                  const isSel = (step === 'quartier' && val === selectedQuartier) || (step === 'ilot' && val === selectedIlot) || (step === 'lot' && val === selectedLot);
                  return (
                    <button
                      key={val}
                      onClick={() => handleSelect(val)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: 'none',
                        background: isSel ? '#fefce8' : 'transparent',
                        color: isSel ? '#92400e' : '#374151',
                        cursor: 'pointer',
                        fontWeight: isSel ? 600 : 400,
                        borderLeft: isSel ? '3px solid #ca8a04' : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}