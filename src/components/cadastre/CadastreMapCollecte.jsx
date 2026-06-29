import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, CircleMarker, useMap, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Layers } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TileSwitcherControl } from './TileLayerSwitcher';
import { LabelLayerControl } from './LabelLayerControl';
import { createPageUrl } from '@/utils';
import ParcelPopup from './ParcelPopup';
import ParcelEditModal from './ParcelEditModal';
import SectionSelectorPanel from './SectionSelectorPanel';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const SECTION_COLORS = ['#73aaf6ff','#fdbd4dff','#ba9dffff'];

function getSectionColor(name, list) {
  return SECTION_COLORS[list.indexOf(name) % SECTION_COLORS.length];
}

function normalizeText(value) {
  return String(value == null ? '' : value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function FitBounds({ geojsonList, triggerFit }) {
  const map = useMap();
  const lastFitRef = useRef(null);
  useEffect(() => {
    if (!geojsonList || geojsonList.length === 0) return;
    // Identifier la nouvelle feature pour éviter de re-fitter sur les mêmes données
    const ids = geojsonList.map((g) => g.sectionId).join(',');
    if (ids === lastFitRef.current) return;
    lastFitRef.current = ids;
    try {
      const all = geojsonList.flatMap((g) => g.features || []);
      if (!all.length) return;
      const layer = L.geoJSON({ type: 'FeatureCollection', features: all });
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } catch (e) {}
  }, [geojsonList]);
  return null;
}

function UserLocation() {
  const map = useMap();
  const markerRef = useRef(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const wId = navigator.geolocation.watchPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (!markerRef.current) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(37,99,235,0.6)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        });
        markerRef.current = L.marker(ll, { icon }).addTo(map).bindPopup('Vous êtes ici');
      } else {
        markerRef.current.setLatLng(ll);
      }
    }, null, { enableHighAccuracy: true, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(wId);
  }, [map]);
  return null;
}

function normalizeKeyPart(value) {
  const normalized = normalizeText(value)
    .replace(/[\s._\/-]+/g, '');

  // 001, 01 et 1 deviennent la même valeur.
  if (/^\d+$/.test(normalized)) {
    return String(Number(normalized));
  }

  return normalized;
}

function getParcelField(props, ...aliases) {
  const entries = Object.entries(props || {});

  for (const alias of aliases) {
    const normalizedAlias = normalizeKeyPart(alias);
    const found = entries.find(([key]) => normalizeKeyPart(key) === normalizedAlias);
    if (found) return found[1] ?? '';
  }

  return '';
}

function buildParcelKey(parts) {
  return parts.map(normalizeKeyPart).join('|');
}

function getFeatureIdentity(props, fallbackCommune = '') {
  return {
    commune: getParcelField(props, 'COMMUNE', 'COMMUNES', 'NOM_COMMUNE') || fallbackCommune,
    quartier: getParcelField(props, 'QUARTIER', 'NOM_QUARTIER', 'VILLAGE'),
    section: getParcelField(props, 'SECTION', 'NUM_SECTION', 'NO_SECTION'),
    parcelle: getParcelField(props, 'PARCELLE', 'NUM_PARCELLE', 'NO_PARCELLE'),
    lot: getParcelField(props, 'LOT', 'NUM_LOT', 'NUMERO_LOT', 'NO_LOT'),
    ilot: getParcelField(props, 'ILOT', 'ÎLOT', 'NUM_ILOT', 'NUMERO_ILOT', 'NO_ILOT'),
  };
}

function getValidatedKeysFromValues(values = {}) {
  const keys = new Set();

  const commune = values.commune || '';
  const quartier = values.quartier || '';
  const section = values.section || '';
  const parcelle = values.parcelle || '';
  const lot = values.lot || '';
  const ilot = values.ilot || '';

  // Clé complète lorsque section/parcelle sont disponibles.
  if (section || parcelle) {
    keys.add(`FULL:${buildParcelKey([commune, section, parcelle, lot, ilot])}`);
    keys.add(`SP:${buildParcelKey([section, parcelle, lot, ilot])}`);
  }

  // Clé métier adaptée aux collectes PostgreSQL actuelles.
  if (lot || ilot) {
    keys.add(`CQLI:${buildParcelKey([commune, quartier, lot, ilot])}`);
    keys.add(`QLI:${buildParcelKey([quartier, lot, ilot])}`);
    keys.add(`LI:${buildParcelKey([lot, ilot])}`);
  }

  return keys;
}

function getFeatureValidatedKeys(props, fallbackCommune = '') {
  return getValidatedKeysFromValues(getFeatureIdentity(props, fallbackCommune));
}

function hasMatchingKey(referenceKeys, candidateKeys) {
  for (const key of candidateKeys) {
    if (referenceKeys.has(key)) return true;
  }
  return false;
}

export default function CadastreMapCollecte({
  commune,
  organisationId,
  collectesExistantes = [],
  convocations = [],
  validatedParcelles = [],
  onParcelleClick,
  onLeaveConvocation,
  onSectionsLoaded,
  isAdmin = false,
  // Nouvelles props : liste des sections (métadonnées) à afficher
  selectedSections = [], // [{id, nom_section, geojson_url, nombre_parcelles}]
  // Props pour le panneau de sélection intégré
  userId,
  selectedSectionIds = [],
  onSectionSelectionChange,
  allCadastreSections = [],
}) {
  const navigate = useNavigate();

  // Cache session : sectionId → geojson data (évite les re-téléchargements)
  const geojsonCacheRef = useRef({});

  // Sections actuellement affichées sur la carte avec leurs données
  const [loadedGeojsons, setLoadedGeojsons] = useState([]);
  const [loadingIds, setLoadingIds] = useState(new Set());

  const [selectedParcel, setSelectedParcel] = useState(null);
  const [editingParcel, setEditingParcel] = useState(null);
  const [editVersion, setEditVersion] = useState(0);
  const parcelleOverridesRef = useRef([]);

  const sections = useMemo(() => loadedGeojsons.map((g) => g.nomSection), [loadedGeojsons]);

  useEffect(() => {
    onSectionsLoaded?.(sections);
  }, [sections, onSectionsLoaded]);

  // Charger les overrides de parcelles depuis la BDD
  const { data: parcelleOverrides = [], refetch: refetchOverrides } = useQuery({
    queryKey: ['parcelle-overrides', organisationId, commune],
    queryFn: () => base44.entities.ParcelleOverride.filter({ organisation_id: organisationId, commune }),
    enabled: !!organisationId && !!commune,
    staleTime: 0,
  });

  useEffect(() => { parcelleOverridesRef.current = parcelleOverrides; }, [parcelleOverrides]);

  // Signature stable : évite de relancer le chargement à chaque rendu React.
  const selectedSectionsKey = useMemo(
    () => selectedSections
      .map((section) => `${section.id}:${section.geojson_url || section.url || ''}`)
      .sort()
      .join('|'),
    [selectedSections]
  );

  // Réagir aux changements réels de sélection de sections.
  useEffect(() => {
    let cancelled = false;
    const selectedIds = new Set(selectedSections.map((section) => section.id));

    // Retirer uniquement les sections réellement désélectionnées.
    setLoadedGeojsons((previous) => {
      const next = previous.filter((item) => selectedIds.has(item.sectionId));
      return next.length === previous.length ? previous : next;
    });

    // Réinjecter immédiatement les sections déjà présentes dans le cache.
    setLoadedGeojsons((previous) => {
      const existingIds = new Set(previous.map((item) => item.sectionId));
      const cachedToAdd = selectedSections
        .filter((section) => !existingIds.has(section.id) && geojsonCacheRef.current[section.id])
        .map((section) => geojsonCacheRef.current[section.id]);

      return cachedToAdd.length ? [...previous, ...cachedToAdd] : previous;
    });

    const sectionsToLoad = selectedSections.filter(
      (section) => !geojsonCacheRef.current[section.id]
    );

    if (!sectionsToLoad.length) {
      setLoadingIds(new Set());
      return () => { cancelled = true; };
    }

    setLoadingIds(new Set(sectionsToLoad.map((section) => section.id)));

    async function loadGeoJson(section) {
      const sourceUrl = section.geojson_url || section.url || section.file_url;
      if (!sourceUrl) {
        throw new Error(`URL GeoJSON absente pour la section ${section.nom_section || section.id}`);
      }

      // Les URL relatives sont résolues sur le domaine Render courant.
      const resolvedUrl = new URL(sourceUrl, window.location.origin).toString();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(resolvedUrl, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} pour ${resolvedUrl}`);
        }

        const geojson = await response.json();
        if (!geojson || !Array.isArray(geojson.features)) {
          throw new Error('Le fichier reçu n’est pas un GeoJSON valide');
        }

        const entry = {
          sectionId: section.id,
          nomSection: section.nom_section || section.nom || `Section ${section.id}`,
          data: geojson,
        };

        geojsonCacheRef.current[section.id] = entry;
        return entry;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    Promise.allSettled(sectionsToLoad.map(loadGeoJson))
      .then((results) => {
        if (cancelled) return;

        const loaded = [];
        const errors = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            loaded.push(result.value);
          } else {
            const section = sectionsToLoad[index];
            errors.push(
              `${section.nom_section || section.id}: ${result.reason?.message || 'chargement impossible'}`
            );
          }
        });

        if (loaded.length) {
          setLoadedGeojsons((previous) => {
            const existingIds = new Set(previous.map((item) => item.sectionId));
            const additions = loaded.filter(
              (item) => selectedIds.has(item.sectionId) && !existingIds.has(item.sectionId)
            );
            return additions.length ? [...previous, ...additions] : previous;
          });
        }

        if (errors.length) {
          console.error('Erreurs de chargement GeoJSON :', errors);
          toast.error(`Carte non chargée : ${errors[0]}`, { duration: 10000 });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSectionsKey]);

  // Un lot devient vert uniquement si une collecte correspondante est validée.
  const recensedKeys = useMemo(() => {
    const keys = new Set();

    collectesExistantes
      .filter((collecte) => normalizeKeyPart(collecte.statut) === 'VALIDEE')
      .forEach((collecte) => {
        getValidatedKeysFromValues({
          commune: collecte.commune || commune,
          quartier: collecte.quartier,
          section: collecte.section,
          parcelle: collecte.parcelle,
          lot: collecte.lot,
          ilot: collecte.ilot,
        }).forEach((key) => keys.add(key));
      });

    // Mise à jour visuelle immédiate après validation, avant même le refetch.
    validatedParcelles.forEach((parcelle) => {
      getValidatedKeysFromValues({
        commune: parcelle.commune || commune,
        quartier: parcelle.quartier,
        section: parcelle.section,
        parcelle: parcelle.parcelle,
        lot: parcelle.lot,
        ilot: parcelle.ilot,
      }).forEach((key) => keys.add(key));
    });

    return keys;
  }, [collectesExistantes, validatedParcelles, commune]);

  const convocationKeys = useMemo(() => {
    const keys = new Set();

    convocations.forEach((convocation) => {
      getValidatedKeysFromValues({
        commune: convocation.commune || commune,
        quartier: convocation.quartier,
        section: convocation.section,
        parcelle: convocation.parcelle,
        lot: convocation.lot,
        ilot: convocation.ilot,
      }).forEach((key) => keys.add(key));
    });

    return keys;
  }, [convocations, commune]);

  // Appliquer les overrides sur les GeoJSON chargés
  const geojsonsWithOverrides = useMemo(() => {
    if (!parcelleOverrides.length) return loadedGeojsons;
    return loadedGeojsons.map((g) => ({
      ...g,
      data: {
        ...g.data,
        features: g.data.features.map((feature) => {
          const props = feature.properties || {};
          const get = (key) => {
            const k = Object.keys(props).find((k) => k.toUpperCase() === key.toUpperCase());
            return k ? props[k] || '' : '';
          };
          const override = parcelleOverrides.find((o) =>
            normalizeKeyPart(o.section_original || '') === normalizeKeyPart(get('SECTION')) &&
            normalizeKeyPart(o.parcelle_original || '') === normalizeKeyPart(get('PARCELLE')) &&
            normalizeKeyPart(o.lot_original || '') === normalizeKeyPart(get('LOT')) &&
            normalizeKeyPart(o.ilot_original || '') === normalizeKeyPart(get('ILOT'))
          );
          if (!override) return feature;
          const updatedProps = { ...props };
          const keyMap = { section: 'SECTION', parcelle: 'PARCELLE', quartier: 'QUARTIER', lot: 'LOT', ilot: 'ILOT', surface: 'SUPERFICIE' };
          Object.entries(keyMap).forEach(([formKey, propKey]) => {
            const existingKey = Object.keys(props).find((k) => k.toUpperCase() === propKey);
            if (override[formKey] !== undefined && override[formKey] !== null && override[formKey] !== '') {
              if (existingKey) updatedProps[existingKey] = override[formKey];
              else updatedProps[propKey] = override[formKey];
            }
          });
          updatedProps.__section_orig = override.section_original || get('SECTION');
          updatedProps.__parcelle_orig = override.parcelle_original || get('PARCELLE');
          updatedProps.__lot_orig = override.lot_original || get('LOT');
          updatedProps.__ilot_orig = override.ilot_original || get('ILOT');
          return { ...feature, properties: updatedProps };
        }),
      },
    }));
  }, [loadedGeojsons, parcelleOverrides]);

  const geojsonDataList = useMemo(
    () => geojsonsWithOverrides.map((g) => ({ sectionId: g.sectionId, features: g.data.features })),
    [geojsonsWithOverrides]
  );

  const isLoadingAny = loadingIds.size > 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Indicateur de chargement en cours */}
      {isLoadingAny && (
        <div className="absolute top-2 left-2 z-[500] bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 flex items-center gap-2 text-xs text-slate-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          Chargement de {loadingIds.size} section{loadingIds.size > 1 ? 's' : ''}…
        </div>
      )}

      {/* Message si aucune section sélectionnée */}
      {selectedSections.length === 0 && !isLoadingAny && (
        <div className="absolute inset-0 flex items-center justify-center z-[400] pointer-events-none">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg max-w-xs">
            <Layers className="w-10 h-10 mx-auto mb-3 text-blue-400 opacity-70" />
            <p className="font-semibold text-slate-700 text-sm">Aucune section sélectionnée</p>
            <p className="text-xs text-slate-500 mt-1">Utilisez le panneau <b>Sections</b> (en haut à droite) pour choisir les zones à afficher.</p>
          </div>
        </div>
      )}

      {/* Modal d'édition de parcelle (admin) */}
      {editingParcel && (
        <ParcelEditModal
          parcelData={editingParcel}
          onClose={() => setEditingParcel(null)}
          onSave={async (updated) => {
            try {
              const sectionOrig = editingParcel._section_original || editingParcel.section || '';
              const parcelleOrig = editingParcel._parcelle_original || editingParcel.parcelle || '';
              const lotOrig = editingParcel._lot_original || editingParcel.lot || '';
              const ilotOrig = editingParcel._ilot_original || editingParcel.ilot || '';

              const existing = parcelleOverridesRef.current.find((o) =>
                normalizeKeyPart(o.section_original || '') === normalizeKeyPart(sectionOrig) &&
                normalizeKeyPart(o.parcelle_original || '') === normalizeKeyPart(parcelleOrig) &&
                normalizeKeyPart(o.lot_original || '') === normalizeKeyPart(lotOrig) &&
                normalizeKeyPart(o.ilot_original || '') === normalizeKeyPart(ilotOrig)
              );
              const overrideData = {
                organisation_id: organisationId,
                commune,
                section_original: sectionOrig,
                parcelle_original: parcelleOrig,
                lot_original: lotOrig,
                ilot_original: ilotOrig,
                section: updated.section,
                parcelle: updated.parcelle,
                quartier: updated.quartier,
                lot: updated.lot,
                ilot: updated.ilot,
                surface: updated.surface ? Number(updated.surface) : null,
              };
              if (existing) {
                await base44.entities.ParcelleOverride.update(existing.id, overrideData);
              } else {
                await base44.entities.ParcelleOverride.create(overrideData);
              }
              await refetchOverrides();
              setEditVersion((v) => v + 1);
              toast.success('Parcelle modifiée avec succès');
            } catch (e) {
              toast.error('Erreur lors de la sauvegarde');
            }
            setEditingParcel(null);
          }}
        />
      )}

      {/* Popup de parcelle sélectionnée */}
      {selectedParcel && (
        <div className="absolute z-[450]">
          <ParcelPopup
            parcelData={selectedParcel}
            onLeaveConvocation={onLeaveConvocation}
            onClose={() => setSelectedParcel(null)}
          />
        </div>
      )}

      <MapContainer
        center={[5.35, -4.0]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileSwitcherControl />
        <LabelLayerControl geojsonDataList={geojsonDataList.map((g) => ({ type: 'FeatureCollection', features: g.features }))} />
        <FitBounds geojsonList={geojsonsWithOverrides.map((g) => ({ sectionId: g.sectionId, features: g.data.features }))} />
        <UserLocation />
        {onSectionSelectionChange && (
          <SectionSelectorPanel
            organisationId={organisationId}
            commune={commune}
            userId={userId}
            selectedSectionIds={selectedSectionIds}
            onSelectionChange={onSectionSelectionChange}
            allSectionsMeta={allCadastreSections}
          />
        )}

        {geojsonsWithOverrides.map(({ sectionId, nomSection, data }) => {
          const color = getSectionColor(nomSection, sections);
          const keysHash = Array.from(recensedKeys).sort().join(',') + '|' + Array.from(convocationKeys).sort().join(',');
          return (
            <GeoJSON
              key={`${sectionId}-${nomSection}-${keysHash}-${editVersion}`}
              data={data}
              style={(feature) => {
                const props = feature.properties || {};
                const featureKeys = getFeatureValidatedKeys(props, commune);
                const isRecensed = hasMatchingKey(recensedKeys, featureKeys);
                const hasConvocation = hasMatchingKey(convocationKeys, featureKeys) && !isRecensed;
                return {
                  color: isRecensed ? '#16a34a' : hasConvocation ? '#64748b' : color,
                  weight: isRecensed || hasConvocation ? 2 : 1.5,
                  fillColor: isRecensed ? '#22c55e' : hasConvocation ? '#94a3b8' : color,
                  fillOpacity: isRecensed ? 0.45 : hasConvocation ? 0.5 : 0.12
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const get = (key) => {
                  const k = Object.keys(p).find((k) => k.toUpperCase() === key.toUpperCase());
                  return k ? p[k] || '' : '';
                };
                const featureKeys = getFeatureValidatedKeys(p, commune);
                const isRecensed = hasMatchingKey(recensedKeys, featureKeys);
                const hasConvocation = hasMatchingKey(convocationKeys, featureKeys) && !isRecensed;

                // Diagnostic : cliquez sur un lot dans la carte puis ouvrez F12 > Console.
                // Vous verrez les propriétés GeoJSON, les clés calculées et le statut de correspondance.
                layer.on('click', () => {
                  console.group('Diagnostic lot GeoJSON');
                  console.log('PROPRIÉTÉS DU LOT GEOJSON :', p);
                  console.log('IDENTITÉ EXTRAITE :', getFeatureIdentity(p, commune));
                  console.log('CLÉS DU LOT :', Array.from(featureKeys));
                  console.log('CLÉS VALIDÉES DISPONIBLES :', Array.from(recensedKeys));
                  console.log('LOT TROUVÉ COMME VALIDÉ :', isRecensed);
                  console.groupEnd();
                });

                const sectionOrig = p.__section_orig || get('SECTION');
                const parcelleOrig = p.__parcelle_orig || get('PARCELLE');
                const lotOrig = p.__lot_orig || get('LOT');
                const ilotOrig = p.__ilot_orig || get('ILOT');

                const parcelDataForTooltip = {
                  section: get('SECTION'),
                  parcelle: get('PARCELLE'),
                  quartier: get('QUARTIER'),
                  lot: get('LOT'),
                  ilot: get('ILOT'),
                  commune: get('COMMUNES') || get('COMMUNE') || commune,
                  coordX: get('COORD X') || get('COORD_X') || get('X') || get('LONGITUDE'),
                  coordY: get('COORD Y') || get('COORD_Y') || get('Y') || get('LATITUDE'),
                  surface: get('SUPERFICIE') || get('SURFACE') ? parseInt(get('SUPERFICIE') || get('SURFACE')) : undefined,
                  isConvocation: hasConvocation,
                  _section_original: sectionOrig,
                  _parcelle_original: parcelleOrig,
                  _lot_original: lotOrig,
                  _ilot_original: ilotOrig,
                };

                const tooltipHtml = `<div style="font-size:12px;line-height:1.6;min-width:140px">
                  ${isRecensed ? '<b style="color:#16a34a">✓ Recensé</b><br/>' : ''}
                  ${hasConvocation ? '<b style="color:#64748b">Convocation laissée</b><br/>' : ''}
                  ${get('SECTION') ? `<b>Section:</b> ${get('SECTION')}<br/>` : ''}
                  <b>Parcelle:</b> ${get('PARCELLE')}<br/>
                  ${get('QUARTIER') ? `<b>Quartier:</b> ${get('QUARTIER')}<br/>` : ''}
                  ${get('LOT') ? `Lot: ${get('LOT')}` : ''} ${get('ILOT') ? `| Îlot: ${get('ILOT')}` : ''}
                </div>`;

                layer.bindTooltip(tooltipHtml, { sticky: true, className: 'leaflet-tooltip-custom' });

                if (isAdmin) {
                  const recenseBtnHtml = !isRecensed
                    ? `<button data-action="recense" style="margin-top:4px;background:#16a34a;color:white;border:none;border-radius:4px;padding:4px 12px;font-size:11px;cursor:pointer;width:100%">${hasConvocation ? '↩ Relancer le recensement' : '▶ Recenser'}</button>`
                    : '';

                  const popupHtml = `<div style="font-size:12px;line-height:1.8;min-width:160px">
                    ${isRecensed ? '<b style="color:#16a34a">✓ Recensé</b><br/>' : ''}
                    ${hasConvocation ? '<b style="color:#64748b">Convocation laissée</b><br/>' : ''}
                    ${get('SECTION') ? `<b>Section:</b> ${get('SECTION')}<br/>` : ''}
                    <b>Parcelle:</b> ${get('PARCELLE')}<br/>
                    ${get('QUARTIER') ? `<b>Quartier:</b> ${get('QUARTIER')}<br/>` : ''}
                    ${get('LOT') ? `Lot: ${get('LOT')}` : ''} ${get('ILOT') ? `| Îlot: ${get('ILOT')}` : ''}
                    <br/><button data-action="edit" style="margin-top:8px;background:#2563eb;color:white;border:none;border-radius:4px;padding:4px 12px;font-size:11px;cursor:pointer;width:100%">✏️ Modifier</button>
                    ${recenseBtnHtml}
                  </div>`;

                  layer.bindPopup(popupHtml, { closeButton: true, maxWidth: 220 });

                  layer.on('popupopen', (e) => {
                    const el = e.popup.getElement();
                    el?.querySelector('[data-action="edit"]')?.addEventListener('click', (ev) => {
                      ev.stopPropagation();
                      layer.closePopup();
                      setEditingParcel(parcelDataForTooltip);
                    });
                    el?.querySelector('[data-action="recense"]')?.addEventListener('click', (ev) => {
                      ev.stopPropagation();
                      layer.closePopup();
                      setSelectedParcel(parcelDataForTooltip);
                    });
                  });
                }

                layer.on('click', () => {
                  if (isAdmin) return;
                  if (!isRecensed) {
                    const parcelData = {
                      section: get('SECTION'),
                      parcelle: get('PARCELLE'),
                      quartier: get('QUARTIER'),
                      lot: get('LOT'),
                      ilot: get('ILOT'),
                      commune: get('COMMUNES') || get('COMMUNE') || commune,
                      coordX: get('COORD X') || get('COORD_X') || get('X') || get('LONGITUDE'),
                      coordY: get('COORD Y') || get('COORD_Y') || get('Y') || get('LATITUDE'),
                      surface: get('SUPERFICIE') || get('SURFACE') ? parseInt(get('SUPERFICIE') || get('SURFACE')) : undefined,
                      isConvocation: hasConvocation
                    };
                    setSelectedParcel(parcelData);
                  } else {
                    toast.info('Cette parcelle a déjà été recensée');
                  }
                });

                layer.on('mouseover', () => {
                  if (!isRecensed) layer.setStyle({ fillOpacity: 0.65, weight: 2.5 });
                });
                layer.on('mouseout', () => {
                  layer.setStyle({
                    fillOpacity: isRecensed ? 0.45 : hasConvocation ? 0.5 : 0.12,
                    weight: isRecensed || hasConvocation ? 2 : 1.5
                  });
                });
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}