import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { TileSwitcherControl } from './TileLayerSwitcher';

// Fix icone Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Couleurs par section
const SECTION_COLORS = ['#73aaf6ff','#fdbd4dff','#ba9dffff'];

function getSectionColor(sectionName, sectionList) {
  const idx = sectionList.indexOf(sectionName);
  return SECTION_COLORS[idx % SECTION_COLORS.length];
}

function FitBoundsToGeoJSON({ geojsonList }) {
  const map = useMap();
  useEffect(() => {
    if (!geojsonList || geojsonList.length === 0) return;
    try {
      const allFeatures = geojsonList.flatMap(g => g.features || []);
      if (allFeatures.length === 0) return;
      const combined = { type: 'FeatureCollection', features: allFeatures };
      const layer = L.geoJSON(combined);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) {}
  }, [geojsonList, map]);
  return null;
}

function UserLocationMarker({ onLocationReady }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      if (!markerRef.current) {
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        markerRef.current = L.marker(latlng, { icon }).addTo(map).bindPopup('Votre position');
      } else {
        markerRef.current.setLatLng(latlng);
      }
      if (onLocationReady) onLocationReady(pos.coords.latitude, pos.coords.longitude);
    }, null, { enableHighAccuracy: true, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [map]);

  return null;
}

export default function CadastreMap({ commune, organisationId, onParcelleSelected }) {
  const [loadedGeojsons, setLoadedGeojsons] = useState([]); // [{nomSection, data}]
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [tileId, setTileId] = useState('carto_light');

  const { data: cadastreSections = [], isLoading } = useQuery({
    queryKey: ['cadastre', organisationId, commune],
    queryFn: () => base44.entities.CadastreCommunal.filter({
      organisation_id: organisationId,
      commune: commune?.toUpperCase()
    }),
    enabled: !!organisationId && !!commune,
    staleTime: 5 * 60 * 1000,
  });

  // Charger les GeoJSON depuis les URLs
  useEffect(() => {
    if (!cadastreSections || cadastreSections.length === 0) return;
    const sectionNames = cadastreSections.map(s => s.nom_section);
    setSections(sectionNames);
    setSelectedSections(sectionNames); // toutes sélectionnées par défaut

    // Charger depuis localStorage (cache offline) ou réseau
    const loadAll = async () => {
      const results = [];
      for (const sec of cadastreSections) {
        const cacheKey = `cadastre_geojson_${sec.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          results.push({ nomSection: sec.nom_section, data: JSON.parse(cached) });
        } else {
          try {
            const resp = await fetch(sec.geojson_url);
            const geojson = await resp.json();
            localStorage.setItem(cacheKey, JSON.stringify(geojson));
            results.push({ nomSection: sec.nom_section, data: geojson });
          } catch (e) {
            console.warn('Impossible de charger', sec.nom_section);
          }
        }
      }
      setLoadedGeojsons(results);
    };
    loadAll();
  }, [cadastreSections]);

  const toggleSection = (name) => {
    setSelectedSections(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleFeatureClick = (feature) => {
    const props = feature.properties || {};
    // Chercher les attributs (insensible à la casse)
    const get = (key) => {
      const keys = Object.keys(props);
      const found = keys.find(k => k.toUpperCase() === key.toUpperCase());
      return found ? props[found] : '';
    };
    if (onParcelleSelected) {
      onParcelleSelected({
        commune: get('COMMUNES') || get('COMMUNE') || commune,
        quartier: get('QUARTIER'),
        section: get('SECTION'),
        parcelle: get('PARCELLE'),
        lot: get('LOT'),
        ilot: get('ILOT'),
      });
    }
  };

  const visibleGeojsons = loadedGeojsons.filter(g => selectedSections.includes(g.nomSection));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
        <span className="ml-2 text-sm text-slate-600">Chargement du cadastre...</span>
      </div>
    );
  }

  if (!cadastreSections || cadastreSections.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-amber-50 border border-amber-200 rounded-lg">
        <MapPin className="w-5 h-5 text-amber-600 mr-2" />
        <span className="text-sm text-amber-700">Aucune donnée cadastrale disponible pour {commune}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Légende / filtre sections */}
      <div className="flex flex-wrap gap-1.5">
        {sections.map((sec, i) => (
          <button
            key={sec}
            onClick={() => toggleSection(sec)}
            className={`px-2 py-1 rounded-full text-xs font-medium border transition-all ${
              selectedSections.includes(sec)
                ? 'text-white border-transparent'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
            style={selectedSections.includes(sec) ? { backgroundColor: getSectionColor(sec, sections) } : {}}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Carte */}
      <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: '320px' }}>
        <MapContainer
          center={[5.35, -4.0]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileSwitcherControl tileId={tileId} onChangeTile={setTileId} />
          <FitBoundsToGeoJSON geojsonList={visibleGeojsons.map(g => g.data)} />
          <UserLocationMarker onLocationReady={(lat, lng) => setUserPos({ lat, lng })} />
          {visibleGeojsons.map(({ nomSection, data }) => (
            <GeoJSON
              key={nomSection}
              data={data}
              style={{
                color: getSectionColor(nomSection, sections),
                weight: 1.5,
                fillOpacity: 0.15,
                fillColor: getSectionColor(nomSection, sections),
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const get = (key) => {
                  const k = Object.keys(p).find(k => k.toUpperCase() === key.toUpperCase());
                  return k ? p[k] : '';
                };
                layer.bindTooltip(
                  `<b>Section: ${get('SECTION') || nomSection}</b><br/>` +
                  `Parcelle: ${get('PARCELLE')}<br/>` +
                  `Quartier: ${get('QUARTIER')}<br/>` +
                  `Lot: ${get('LOT')} | Îlot: ${get('ILOT')}`,
                  { sticky: true }
                );
                layer.on('click', () => handleFeatureClick(feature));
                layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.5, weight: 2.5 }));
                layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.15, weight: 1.5 }));
              }}
            />
          ))}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Cliquez sur une parcelle pour pré-remplir les champs automatiquement
      </p>
    </div>
  );
}