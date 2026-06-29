import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, LocateFixed, Loader2, CheckCircle2, AlertCircle, X, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormField from './FormField';
import { useLastEnteredValues } from './useLastEnteredValues';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CadastreMap from '@/components/cadastre/CadastreMap';

const GPS_TARGET_ACCURACY = 5;   // mètres
const GPS_MAX_DURATION = 30000;  // 30 secondes

export default function StepParcelle({ data, onChange, isFromMap = false }) {
  const { getLastValues } = useLastEnteredValues();
  const lastValues = getLastValues();
  const [communeOptions, setCommuneOptions] = useState([]);
  const [showCadastreMap, setShowCadastreMap] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsElapsed, setGpsElapsed] = useState(0);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(null);
  const bestPositionRef = useRef(null);

  const stopGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
  };

  const applyBestPosition = () => {
    if (bestPositionRef.current) {
      const pos = bestPositionRef.current;
      onChange({ target: { name: 'longitude', value: parseFloat(pos.coords.longitude.toFixed(6)) } });
      onChange({ target: { name: 'latitude', value: parseFloat(pos.coords.latitude.toFixed(6)) } });
      setGpsAccuracy(Math.round(pos.coords.accuracy));
      setGpsStatus('success');
    } else {
      setGpsStatus('error');
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }

    // Reset
    stopGps();
    bestPositionRef.current = null;
    setGpsStatus('loading');
    setGpsAccuracy(null);
    setGpsElapsed(0);

    // Compteur de temps écoulé
    elapsedRef.current = setInterval(() => {
      setGpsElapsed(prev => prev + 1);
    }, 1000);

    // Timeout 30 secondes : prendre la meilleure position obtenue
    timerRef.current = setTimeout(() => {
      stopGps();
      applyBestPosition();
    }, GPS_MAX_DURATION);

    // watchPosition avec maximumAge:0 pour forcer acquisition fraîche
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        setGpsAccuracy(Math.round(acc));
        // Garder la meilleure précision
        if (!bestPositionRef.current || acc < bestPositionRef.current.coords.accuracy) {
          bestPositionRef.current = pos;
        }
        // Arrêter si précision ≤ 5m atteinte
        if (acc <= GPS_TARGET_ACCURACY) {
          stopGps();
          onChange({ target: { name: 'longitude', value: parseFloat(pos.coords.longitude.toFixed(6)) } });
          onChange({ target: { name: 'latitude', value: parseFloat(pos.coords.latitude.toFixed(6)) } });
          setGpsAccuracy(Math.round(acc));
          setGpsStatus('success');
        }
      },
      () => { stopGps(); setGpsStatus('error'); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
  };

  const handleCancelGps = () => {
    stopGps();
    applyBestPosition();
  };

  // Nettoyage au démontage
  useEffect(() => () => stopGps(), []);

  // Récupérer l'utilisateur courant pour obtenir son organisation
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Récupérer l'organisation pour les communes
  const { data: organisation } = useQuery({
    queryKey: ['organisation', user?.organisation_id],
    queryFn: () => base44.entities.Organisation.filter({ id: user.organisation_id }).then(orgs => orgs[0]),
    enabled: !!user?.organisation_id,
  });

  useEffect(() => {
    if (organisation?.communes) {
      setCommuneOptions(organisation.communes.map(commune => ({
        value: commune,
        label: commune
      })));
    }
  }, [organisation]);
  
  const natureOptions = [
    { value: 'non_battie', label: 'NON BÂTIE' },
    { value: 'battie', label: 'BÂTIE' },
    { value: 'partiellement_battie', label: 'PARTIELLEMENT BÂTIE' },
    { value: 'indeterminee', label: 'INDÉTERMINÉE' }
  ];

  // Fusionner les communes existantes avec la commune actuelle pour éviter qu'elle disparaisse
  const displayCommuneOptions = React.useMemo(() => {
    const options = [...communeOptions];
    if (data.commune && !communeOptions.some(opt => opt.value === data.commune.toUpperCase())) {
      options.unshift({ 
        value: data.commune.toUpperCase(), 
        label: data.commune.toUpperCase() 
      });
    }
    return options;
  }, [communeOptions, data.commune]);



  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-t-lg p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
          <MapPin className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="line-clamp-2">Informations sur la Parcelle</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <FormField
            label="Commune"
            name="commune"
            type="select"
            value={data.commune}
            onChange={onChange}
            options={displayCommuneOptions}
            placeholder="Sélectionner une commune"
          />
          <FormField
            label="Section"
            name="section"
            value={data.section || ''}
            onChange={onChange}
            placeholder="Section cadastrale"
            uppercase
          />
          <FormField
            label="Parcelle"
            name="parcelle"
            value={data.parcelle}
            onChange={onChange}
            placeholder="N° parcelle"
            uppercase
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <FormField
            label="Code Exemption"
            name="code_exemption"
            value={data.code_exemption}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="Année d'acquisition"
            name="annee_acq"
            value={data.annee_acq}
            onChange={onChange}
            placeholder="AAAA"
            uppercase
          />
          <FormField
            label="Nature"
            name="nature"
            type="select"
            value={data.nature}
            onChange={onChange}
            options={natureOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Surface Imposable (m²)"
            name="surface_imposable"
            type="text"
            value={data.surface_imposable}
            onChange={onChange}
            inputMode="numeric"
          />
          <FormField
            label="Valeur Vénale"
            name="valeur_venale"
            type="number"
            value={data.valeur_venale}
            onChange={onChange}
          />
          <FormField
            label="Code VV"
            name="code_vv"
            value={data.code_vv}
            onChange={onChange}
            uppercase
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <FormField
            label="Quartier"
            name="quartier"
            value={data.quartier || ''}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="Code Quartier"
            name="code_quartier"
            value={data.code_quartier}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="T.F."
            name="tf"
            value={data.tf}
            onChange={onChange}
            uppercase
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <FormField
            label="Lot"
            name="lot"
            value={data.lot}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="Îlot"
            name="ilot"
            value={data.ilot || ''}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="N° Appartement"
            name="num_appartement"
            value={data.num_appartement}
            onChange={onChange}
            uppercase
          />
          <FormField
            label="Niveau Appartement"
            name="niveau_appartement"
            value={data.niveau_appartement}
            onChange={onChange}
            uppercase
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <FormField
            label="Référence DGI"
            name="reference_dgi"
            value={data.reference_dgi}
            onChange={onChange}
            placeholder="DGI IN 99 - xxxxxx"
            uppercase
          />
          {isFromMap && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Longitude X</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="longitude"
                  value={data.longitude ?? ''}
                  onChange={(e) => onChange({ target: { name: 'longitude', value: e.target.value } })}
                  className="h-10 sm:h-12 border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Latitude Y</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="latitude"
                  value={data.latitude ?? ''}
                  onChange={(e) => onChange({ target: { name: 'latitude', value: e.target.value } })}
                  className="h-10 sm:h-12 border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </>
          )}
        </div>


        {/* Localisation GPS WGS 84 */}
        {!isFromMap && (
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Position GPS (WGS 84)
            </span>
            <div className="flex gap-2">
              {gpsStatus === 'loading' && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCancelGps}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-3"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Utiliser position actuelle
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleLocate}
                disabled={gpsStatus === 'loading'}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 px-3"
              >
                {gpsStatus === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5 mr-1" />
                )}
                {gpsStatus === 'loading' ? 'Acquisition...' : 'Localiser'}
                {gpsStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-green-300" />}
                {gpsStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 ml-1 text-red-300" />}
              </Button>
            </div>
          </div>
          {/* Barre de progression pendant acquisition */}
          {gpsStatus === 'loading' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-blue-700 font-medium">
                  {gpsAccuracy !== null ? `Précision actuelle : ${gpsAccuracy}m` : 'Acquisition GPS en cours...'}
                </span>
                <span className="text-slate-500">{gpsElapsed}s / 30s</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((gpsElapsed / 30) * 100, 100)}%` }}
                />
              </div>
              {gpsAccuracy !== null && (
                <p className="text-xs mt-1" style={{ color: gpsAccuracy <= GPS_TARGET_ACCURACY ? '#16a34a' : '#d97706' }}>
                  {gpsAccuracy <= GPS_TARGET_ACCURACY
                    ? `✓ Précision satisfaisante (≤ ${GPS_TARGET_ACCURACY}m)`
                    : `Cible : ≤ ${GPS_TARGET_ACCURACY}m — Pointez vers le ciel...`}
                </p>
              )}
            </div>
          )}
          {gpsStatus === 'success' && gpsAccuracy !== null && (
            <p className="text-xs text-green-600 mb-2">✓ Position enregistrée — Précision : {gpsAccuracy}m</p>
          )}
          {gpsStatus === 'error' && (
            <p className="text-xs text-red-600 mb-2">Impossible d'obtenir la position. Vérifiez les permissions GPS.</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Longitude X</label>
              <input
                type="text"
                inputMode="decimal"
                name="longitude"
                value={data.longitude ?? ''}
                onChange={(e) => onChange({ target: { name: 'longitude', value: e.target.value } })}
                placeholder="ex: -4.234567"
                className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Latitude Y</label>
              <input
                type="text"
                inputMode="decimal"
                name="latitude"
                value={data.latitude ?? ''}
                onChange={(e) => onChange({ target: { name: 'latitude', value: e.target.value } })}
                placeholder="ex: 12.345678"
                className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}