import { useMemo, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TileSwitcherControl } from '@/components/cadastre/TileLayerSwitcher';

// Couleurs primaires distinctes, attribuées dynamiquement aux communes présentes
const PRIMARY_COLORS = [
  '#E53935', // Rouge
  '#1E88E5', // Bleu
  '#43A047', // Vert
  '#FDD835', // Jaune
  '#FB8C00', // Orange
  '#8E24AA', // Violet
  '#00ACC1', // Cyan
  '#F06292', // Rose
  '#6D4C41', // Marron
  '#546E7A', // Gris-bleu
];

// Cache dynamique : commune → couleur attribuée dans l'ordre
const dynamicCommuneColors = {};
let colorIndex = 0;

const getCommuneColor = (commune) => {
  const key = (commune || 'Non spécifié').toUpperCase().trim();
  if (!dynamicCommuneColors[key]) {
    dynamicCommuneColors[key] = PRIMARY_COLORS[colorIndex % PRIMARY_COLORS.length];
    colorIndex++;
  }
  return dynamicCommuneColors[key];
};

// Créer une icône personnalisée avec couleur
const createCommuneIcon = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Composant pour gérer les contrôles Leaflet
function MapControls({ communes, tileId, onChangeTile }) {
  const map = useMap();

  useEffect(() => {
    // Légende personnalisée
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar legend-control');
      div.style.backgroundColor = 'white';
      div.style.padding = '12px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.style.maxHeight = '300px';
      div.style.overflowY = 'auto';
      div.style.fontSize = '12px';
      div.style.fontFamily = 'Arial, sans-serif';
      div.style.lineHeight = '1.5';
      div.style.minWidth = '180px';

      let html = `<strong style="display: block; margin-bottom: 8px; font-size: 13px;">Communes (${communes.size})</strong>`;
      Array.from(communes).forEach(([commune, color]) => {
        html += `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #999; flex-shrink: 0;"></div>
            <span style="color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${commune}">${commune}</span>
          </div>
        `;
      });

      div.innerHTML = html;
      return div;
    };
    legend.addTo(map);

    return () => {
      map.removeControl(legend);
    };
  }, [map, communes]);

  return null;
}

export default function CollecteMap({ collectes = [] }) {
  const [tileId, setTileId] = useState('carto_light');

  // Filtrer les collectes avec coordonnées GPS valides
  const collectesWithGPS = useMemo(() => {
    return collectes.filter(c => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude));
  }, [collectes]);

  // Grouper par commune pour la légende
  const communes = useMemo(() => {
    const unique = new Map();
    collectesWithGPS.forEach(c => {
      const comm = c.commune || 'Non spécifié';
      if (!unique.has(comm)) unique.set(comm, getCommuneColor(comm));
    });
    return unique;
  }, [collectesWithGPS]);

  // Calculer le centre et les bornes de la carte
  const mapCenter = useMemo(() => {
    if (collectesWithGPS.length === 0) return [7.54, -5.55]; // Centre Côte d'Ivoire
    
    const lats = collectesWithGPS.map(c => parseFloat(c.latitude));
    const lngs = collectesWithGPS.map(c => parseFloat(c.longitude));
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  }, [collectesWithGPS]);

  if (collectesWithGPS.length === 0) {
    return (
      <div className="w-full h-80 sm:h-96 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-sm">
        Aucune collecte avec coordonnées GPS
      </div>
    );
  }

  return (
    <div className="h-80 sm:h-96 rounded-lg overflow-hidden shadow-md border border-slate-200">
      <MapContainer center={mapCenter} zoom={10} style={{ width: '100%', height: '100%' }}>
        <TileSwitcherControl tileId={tileId} onChangeTile={setTileId} />
        <MapControls communes={communes} tileId={tileId} onChangeTile={setTileId} />
        <LayerGroup>
          {collectesWithGPS.map((collecte) => (
            <Marker
              key={collecte.id}
              position={[parseFloat(collecte.latitude), parseFloat(collecte.longitude)]}
              icon={createCommuneIcon(getCommuneColor(collecte.commune))}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{collecte.commune || 'Commune inconnue'}</p>
                  <p>Quartier: {collecte.quartier || '—'}</p>
                  <p>Parcelle: {collecte.parcelle || '—'}</p>
                  <p>Propriétaire: {collecte.type_proprietaire === 'particulier' 
                    ? `${collecte.prop_nom || ''} ${collecte.prop_prenoms || ''}` 
                    : collecte.societe_raison_sociale || '—'}</p>
                  <p>Statut: <span className={`font-semibold ${
                    collecte.statut === 'validee' ? 'text-green-600' :
                    collecte.statut === 'complete' ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>{collecte.statut || 'brouillon'}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}