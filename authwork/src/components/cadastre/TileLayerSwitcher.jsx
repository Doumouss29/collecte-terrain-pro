import React, { useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { Layers } from 'lucide-react';

export const TILE_LAYERS = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    tileLayerOptions: { referrerPolicy: 'no-referrer-when-downgrade' },
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    tileLayerOptions: { referrerPolicy: 'no-referrer-when-downgrade' },
  },
];

// Bouton flottant avec cases à cocher (à placer DANS le MapContainer)
export function TileSwitcherControl() {
  const [open, setOpen] = useState(false);
  const [activeTiles, setActiveTiles] = useState({ osm: false, satellite: false, terrain: false });

  const toggle = (id) => {
    setActiveTiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const anyActive = Object.values(activeTiles).some(Boolean);

  return (
    <>
      {TILE_LAYERS.filter(t => activeTiles[t.id]).map(tile => (
        <TileLayer
          key={tile.id}
          url={tile.url}
          attribution={tile.attribution}
          {...(tile.tileLayerOptions || {})}
          opacity={activeTiles.satellite && activeTiles.osm && tile.id === 'satellite' ? 0.6 : 1}
        />
      ))}
      <div
        className="leaflet-top leaflet-right"
        style={{ pointerEvents: 'auto', zIndex: 9999, marginTop: '8px', marginRight: '8px' }}
      >
        <div className="leaflet-control" style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            title="Fonds de carte"
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
            <Layers size={18} />
            <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Fonds de carte</span>
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
              zIndex: 9999,
            }}>
              <div style={{ padding: '6px 10px', fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                Fonds de carte
              </div>
              {TILE_LAYERS.map(tile => (
                <button
                  key={tile.id}
                  onClick={() => toggle(tile.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    fontSize: '12px',
                    fontWeight: activeTiles[tile.id] ? 600 : 400,
                    color: activeTiles[tile.id] ? '#2563eb' : '#374151',
                    background: activeTiles[tile.id] ? '#eff6ff' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderLeft: activeTiles[tile.id] ? '3px solid #2563eb' : '3px solid transparent',
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `2px solid ${activeTiles[tile.id] ? '#2563eb' : '#9ca3af'}`,
                    background: activeTiles[tile.id] ? '#2563eb' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {activeTiles[tile.id] && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
                  </span>
                  {tile.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}