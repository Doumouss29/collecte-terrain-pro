import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { ZoomFilterControl } from './ZoomFilterControl';

// Seuils de zoom pour l'affichage des labels
const ZOOM_ILOT = 16;     // Îlot visible à partir du zoom 16
const ZOOM_LOT = 18;      // Lot visible seulement à l'échelle rue
const ZOOM_PARCELLE = 18; // Parcelle visible seulement à l'échelle rue

function makeIcon(html) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:11px;font-weight:700;white-space:nowrap;text-shadow:-1px -1px 0 white,1px -1px 0 white,-1px 1px 0 white,1px 1px 0 white;pointer-events:none;transform:translate(-50%,-50%)">${html}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function getFeatureCenter(feature) {
  try {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) return bounds.getCenter();
  } catch (e) {}
  return null;
}

function getField(props, key) {
  const k = Object.keys(props || {}).find(k => k.toUpperCase() === key.toUpperCase());
  return k ? (props[k] || '') : '';
}

// Calcule la moyenne des centroïdes d'un groupe de features → centre du groupe
function groupCenter(features) {
  let latSum = 0, lngSum = 0, count = 0;
  features.forEach(f => {
    const c = getFeatureCenter(f);
    if (c) { latSum += c.lat; lngSum += c.lng; count++; }
  });
  if (!count) return null;
  return L.latLng(latSum / count, lngSum / count);
}

// Composant qui gère l'affichage des labels sur la carte
function LabelRenderer({ geojsonDataList, showIlot, showLot, showParcelle }) {
  const map = useMap();
  const markersRef = useRef([]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  };

  const renderLabels = () => {
    clearMarkers();
    const zoom = map.getZoom();
    const newMarkers = [];

    // Collecter toutes les features de tous les geojsons
    const allFeatures = geojsonDataList.flatMap(g => g.features || []);
    // Bounds actuels de la carte (pour filtrer les features visibles)
    const bounds = map.getBounds();

    // --- Labels ÎLOT : grouper par îlot+quartier pour éviter les fusions entre quartiers différents ---
    if (showIlot && zoom >= ZOOM_ILOT) {
      const ilotGroups = {};
      allFeatures.forEach(feature => {
        const props = feature.properties || {};
        const ilot = getField(props, 'ILOT');
        if (!ilot) return;
        // Si le quartier est absent/vide, on groupe uniquement par îlot
        const quartier = getField(props, 'QUARTIER') || getField(props, 'COMMUNES') || '';
        const key = quartier ? `${quartier}__${ilot}` : ilot;
        if (!ilotGroups[key]) ilotGroups[key] = { ilot, features: [] };
        ilotGroups[key].features.push(feature);
      });
      Object.values(ilotGroups).forEach(({ ilot, features }) => {
        // Filtrer les features dont le centre est visible pour calculer un centroïde pertinent
        const visibleFeatures = features.filter(f => {
          const c = getFeatureCenter(f);
          return c && bounds.contains(c);
        });
        // Si aucune feature visible, utiliser quand même toutes les features (îlot partiellement visible)
        const featuresForCenter = visibleFeatures.length > 0 ? visibleFeatures : features;
        const center = groupCenter(featuresForCenter);
        if (!center) return;
        // N'afficher le label que si son centre est dans ou proche des bounds
        const expandedBounds = bounds.pad(0.1);
        if (!expandedBounds.contains(center)) return;
        const icon = makeIcon(`<span style="color:#16a34a">${ilot}</span>`);
        const marker = L.marker(center, { icon, interactive: false, zIndexOffset: -100 });
        marker.addTo(map);
        newMarkers.push(marker);
      });
    }

    // --- Labels LOT + PARCELLE : combinés par feature pour éviter la superposition ---
    if ((showLot || showParcelle) && zoom >= ZOOM_LOT) {
      allFeatures.forEach(feature => {
        const props = feature.properties || {};
        const lot = getField(props, 'LOT');
        const parcelle = getField(props, 'PARCELLE');
        if (!lot && !parcelle) return;
        const center = getFeatureCenter(feature);
        if (!center || !bounds.contains(center)) return;

        let lines = [];
        if (showLot && lot) lines.push(`<span style="color:#dc2626">${lot}</span>`);
        if (showParcelle && parcelle) lines.push(`<span style="color:#2563eb">${parcelle}</span>`);
        if (!lines.length) return;

        const html = lines.join('<br/>');
        const icon = makeIcon(html);
        const marker = L.marker(center, { icon, interactive: false, zIndexOffset: -100 });
        marker.addTo(map);
        newMarkers.push(marker);
      });
    }

    markersRef.current = newMarkers;
  };

  useEffect(() => {
    renderLabels();
    map.on('zoomend', renderLabels);
    map.on('moveend', renderLabels);
    return () => {
      map.off('zoomend', renderLabels);
      map.off('moveend', renderLabels);
      clearMarkers();
    };
  }, [map, geojsonDataList, showIlot, showLot, showParcelle]);

  return null;
}

// Bouton de contrôle flottant avec les 3 toggles
export function LabelLayerControl({ geojsonDataList }) {

  const [showIlot, setShowIlot] = useState(false);
  const [showLot, setShowLot] = useState(false);
  const [showParcelle, setShowParcelle] = useState(false);
  const [open, setOpen] = useState(false);

  const anyActive = showIlot || showLot || showParcelle;

  const toggleStyle = (active, color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: active ? `${color}18` : 'transparent',
    color: active ? color : '#374151',
    width: '100%',
    textAlign: 'left',
    borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
  });

  return (
    <>
      {(showIlot || showLot || showParcelle) && (
        <LabelRenderer
          geojsonDataList={geojsonDataList}
          showIlot={showIlot}
          showLot={showLot}
          showParcelle={showParcelle}
        />
      )}
      <ZoomFilterControl geojsonDataList={geojsonDataList} />
      <div
        className="leaflet-top leaflet-right"
        style={{ pointerEvents: 'auto', zIndex: 1000, marginTop: '52px', marginRight: '8px' }}
      >
        <div className="leaflet-control" style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            title="Afficher les numéros"
            style={{
              background: anyActive ? '#eff6ff' : 'white',
              border: `2px solid ${anyActive ? '#2563eb' : 'rgba(0,0,0,0.2)'}`,
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: anyActive ? '#2563eb' : '#374151',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>123</span>
            <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Numéros</span>
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
              overflow: 'hidden',
              minWidth: '160px',
            }}>
              <div style={{ padding: '6px 10px', fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                Afficher les numéros
              </div>

              <button onClick={() => setShowIlot(v => !v)} style={toggleStyle(showIlot, '#16a34a')}>
                <span style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: `2px solid #16a34a`,
                  background: showIlot ? '#16a34a' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {showIlot && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                </span>
                <span>Numéro d'îlot</span>
              </button>

              <button onClick={() => setShowLot(v => !v)} style={toggleStyle(showLot, '#dc2626')}>
                <span style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: `2px solid #dc2626`,
                  background: showLot ? '#dc2626' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {showLot && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                </span>
                <span>Numéro de lot</span>
              </button>

              <button onClick={() => setShowParcelle(v => !v)} style={toggleStyle(showParcelle, '#2563eb')}>
                <span style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: `2px solid #2563eb`,
                  background: showParcelle ? '#2563eb' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {showParcelle && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                </span>
                <span>Numéro de parcelle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}