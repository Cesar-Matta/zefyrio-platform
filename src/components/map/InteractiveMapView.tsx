"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Wind, Plane, Map as MapIcon, X, CloudRain, Navigation, RadioTower, Layers, Cloud, Sun, Crosshair, MapPin, Flag, Eye, AlertTriangle, ShieldAlert, Target, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import SmartAirportMarker from './SmartAirportMarker';
import ForecastBar8Day from '../weather/ForecastBar8Day';
import type { MetarData, AircraftPosition } from '@/lib/types/api';
import { fetchWithTimeout } from '@/lib/api/fetchWithTimeout';

interface AirspaceProps {
  type?: number | string;
  icaoClass?: number | string;
  activity?: number | string;
}

interface AirspaceFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown[] };
  properties: {
    _id?: string;
    name?: string;
    type?: number | string;
    icaoClass?: number | string;
    activity?: number | string;
    upperLimit?: { value?: number; unit?: number };
    lowerLimit?: { value?: number; unit?: number };
  };
}

// ─── Icons & Components ──────────────────────────────────────────────────────

const HUD_COLORS = {
  cyan: 'var(--color-system-blue)',
  green: 'var(--color-system-green)',
  amber: 'var(--color-system-orange)',
  red: 'var(--color-system-red)',
  purple: '#8B5CF6',
};

const C = { E: 'E', F: 'F', G: 'G' };
const T = { RESTRICTED: 'R', DANGER: 'D', PROHIBITED: 'P', CTR: 'CTR', TMA: 'TMA', SPECIAL: 'SUA' };
const ACT = { MILITARY: 'MIL', GLIDING: 'GLD', HANGGLIDING: 'HG', RC: 'RC', PARACHUTING: 'PAR' };

interface LayerDef { id: string; label: string; icon: LucideIcon; color: string; group: string; filter?: (p: AirspaceProps) => boolean; }

const LAYER_DEFS: LayerDef[] = [
  { id: 'classE',     label: 'Clase E',          icon: MapPin,     color: '#9B59B6', group: 'navigation',  filter: p => p.icaoClass === C.E },
  { id: 'classF',     label: 'Clase F',          icon: MapPin,     color: '#6C3483', group: 'navigation',  filter: p => p.icaoClass === C.F },
  { id: 'classG',     label: 'Clase G',          icon: MapPin,     color: '#27AE60', group: 'navigation',  filter: p => p.icaoClass === C.G },
  { id: 'restricted', label: 'Área Restringida', icon: ShieldAlert,color: 'var(--color-system-red)', group: 'navigation',  filter: p => p.type === T.RESTRICTED },
  { id: 'danger',     label: 'Área de Peligro',  icon: AlertTriangle, color: 'var(--color-system-orange)', group: 'navigation',  filter: p => p.type === T.DANGER },
  { id: 'prohibited', label: 'Área Prohibida',   icon: X,          color: '#CC0000', group: 'navigation',  filter: p => p.type === T.PROHIBITED },
  { id: 'ctr',        label: 'CTR',              icon: Target,     color: '#0088FF', group: 'navigation',  filter: p => p.type === T.CTR },
  { id: 'tma',        label: 'TMA',              icon: Navigation, color: '#00CCFF', group: 'navigation',  filter: p => p.type === T.TMA },
  { id: 'special',    label: 'Uso Especial',     icon: Flag,       color: '#C0392B', group: 'navigation',  filter: p => p.type === T.SPECIAL },
  { id: 'military',   label: 'Área Militar',     icon: Shield,     color: '#808000', group: 'navigation',  filter: p => p.activity === ACT.MILITARY },
  { id: 'gliding',    label: 'Sectores Planeo',  icon: Wind,       color: 'var(--color-system-green)', group: 'navigation',  filter: p => p.activity === ACT.GLIDING },
  { id: 'hanggliding',label: 'Ala Delta',        icon: Wind,       color: '#FFA500', group: 'navigation',  filter: p => p.activity === ACT.HANGGLIDING },
  { id: 'rc',         label: 'RC Airfields',     icon: RadioTower, color: '#00CED1', group: 'navigation',  filter: p => p.activity === ACT.RC },
  { id: 'parachuting',label: 'Paracaidismo',     icon: Crosshair,  color: '#FFD700', group: 'navigation',  filter: p => p.activity === ACT.PARACHUTING },
  { id: 'adsb',       label: 'Tráfico ADS-B en Vivo', icon: Plane, color: 'var(--color-system-green)', group: 'traffic' },
  { id: 'airports',   label: 'Aeropuertos y METAR', icon: RadioTower, color: 'var(--color-system-blue)', group: 'airports' },
  { id: 'radar',      label: 'Radar de Lluvia',  icon: CloudRain,  color: '#00BFFF', group: 'weather' },
  { id: 'clouds',     label: 'Nubes (IR Satélite)', icon: Cloud,   color: '#FFFFFF', group: 'weather' },
  { id: 'cloudsVis',  label: 'Nubes (Visible)',  icon: Sun,        color: '#FFFFAA', group: 'weather' },
  { id: 'satellite',  label: 'Satélite Visual',  icon: Eye,        color: '#94A3B8', group: 'base' },
];

const LAYER_INITIAL: Record<string, boolean> = {
  classE: false, classF: false, classG: false,
  restricted: true, danger: true, prohibited: true, ctr: true, tma: false, special: false,
  military: false, gliding: false, hanggliding: false, rc: false, parachuting: false,
  adsb: false, radar: false, clouds: false, cloudsVis: false, satellite: false, airports: true,
};

const GROUP_META: Record<string, { label: string; icon: LucideIcon; accent: string }> = {
  weather:     { label: 'METEOROLOGÍA',  icon: CloudRain,    accent: '#00BFFF' },
  navigation:  { label: 'NAVEGACIÓN',    icon: MapIcon,      accent: 'var(--color-system-red)' },
  traffic:     { label: 'TRÁFICO VIVO',  icon: Plane,        accent: 'var(--color-system-green)' },
  airports:    { label: 'AERÓDROMOS',    icon: RadioTower,   accent: 'var(--color-system-blue)' },
  base:        { label: 'MAPA BASE',     icon: Layers,       accent: '#94A3B8' },
};

function MapEventsHandler({ onMoveEnd, onDoubleClick }: {
  onMoveEnd: (lat: number, lon: number, zoom: number, bbox: string) => void;
  onDoubleClick?: (lat: number, lon: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      onMoveEnd(center.lat, center.lng, zoom, bbox);
    },
    dblclick: (e) => {
      if (onDoubleClick) onDoubleClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const createAircraftIcon = (trueTrack: number, category: string) => {
  const rotate = (trueTrack || 0) - 45;
  const size = category === '5' ? 28 : 20;
  const color = category === '7' ? HUD_COLORS.cyan : HUD_COLORS.green;
  
  return L.divIcon({
    className: 'adsb-icon',
    html: `<div style="width: ${size}px; height: ${size}px; transform: rotate(${rotate}deg); filter: drop-shadow(0 0 4px ${color});">
      <svg viewBox="0 0 24 24" fill="${color}"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface InteractiveMapViewProps {
  initialLat: number;
  initialLon: number;
  onSyncLocation?: (lat: number, lon: number) => void;
}

export default function InteractiveMapView({ initialLat, initialLon, onSyncLocation }: InteractiveMapViewProps) {
  const { isDark } = useTheme();
  const [layers, setLayers] = useState<Record<string, boolean>>(LAYER_INITIAL);
  const [showControls, setShowControls] = useState(true);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [aircrafts, setAircrafts] = useState<AircraftPosition[]>([]);
  const [metars, setMetars] = useState<MetarData[]>([]);
  const [tafs, setTafs] = useState<Array<{ icaoId: string; rawTAF?: string }>>([]);
  const [notams, setNotams] = useState<Array<{ icaoId: string; id?: string; content?: string }>>([]);
  const [rainPath, setRainPath] = useState<string | null>(null);
  const [airspaces, setAirspaces] = useState<AirspaceFeature[]>([]);
  // Colombia local airport info (from co_airports.geojson)
  const [coAirports, setCoAirports] = useState<Record<string, any>>({});
  const lastAeroFetch = React.useRef<{lat: number, lon: number}>({ lat: -999, lon: -999 });
  
  const [mapState, setMapState] = useState({
    lat: initialLat, lon: initialLon, zoom: 9,
    bbox: `${initialLat-1},${initialLon-1},${initialLat+1},${initialLon+1}`
  });

  useEffect(() => {
    fetchWithTimeout('https://api.rainviewer.com/public/weather-maps.json', {}, 5000)
      .then(res => res.json())
      .then(data => { 
        if (data.radar?.past?.length > 0) {
          const pathVal = data.radar.past[data.radar.past.length - 1].path;
          console.log("RainViewer latest past path loaded:", pathVal);
          setRainPath(pathVal); 
        } 
      })
      .catch(err => {
        console.error("RainViewer TS Error:", err);
        setRainPath('/v2/radar/e780b0ed03f4');
      });

    // Load Colombia local airport info for enriched popups
    fetch('/data/co_airports.geojson')
      .then(r => r.json())
      .then((d: { features: Array<{ properties: any }> }) => {
        const map: Record<string, any> = {};
        d.features.forEach(f => {
          const icao = f.properties.icaoCode;
          if (icao) map[icao.toUpperCase()] = f.properties;
        });
        setCoAirports(map);
      })
      .catch(() => {});
  }, []);

  const handleMapMove = useCallback((lat: number, lon: number, zoom: number, bbox: string) => {
    setMapState({ lat, lon, zoom, bbox });
  }, []);

  useEffect(() => {
    if (!layers.adsb) return;
    const fetchAdsb = async () => {
      try {
        const res = await fetch(`/api/adsb?bbox=${mapState.bbox}`);
        const data = await res.json() as { aircraft?: AircraftPosition[] };
        if (data.aircraft) setAircrafts(data.aircraft);
      } catch (err) { console.error("ADS-B Fetch Error:", err); }
    };
    fetchAdsb();
    const interval = setInterval(fetchAdsb, 15000);
    return () => clearInterval(interval);
  }, [layers.adsb, mapState.bbox]);

  useEffect(() => {
    // Prevent refetching (which unmounts popups) on micro-movements like Leaflet popup auto-pan
    if (Math.abs(mapState.lat - lastAeroFetch.current.lat) < 0.5 && 
        Math.abs(mapState.lon - lastAeroFetch.current.lon) < 0.5) {
      return;
    }
    lastAeroFetch.current = { lat: mapState.lat, lon: mapState.lon };

    // Re-fetch aeronautical data when map center changes significantly
    fetch(`/api/aero?lat=${mapState.lat}&lon=${mapState.lon}`)
      .then(r => r.json())
      .then(d => { 
        if (d.metar) setMetars(d.metar); 
        if (d.taf) setTafs(d.taf);
        if (d.notams) setNotams(d.notams);
      })
      .catch(() => {});
  }, [mapState.lat, mapState.lon]);

  useEffect(() => {
    const parts = mapState.bbox.split(',');
    if (parts.length !== 4) return;
    const [south, west, north, east] = parts;
    fetch(`/api/airspaces?south=${south}&west=${west}&north=${north}&east=${east}`)
      .then(r => r.json())
      .then(d => {
        if (d.features) setAirspaces(d.features);
      })
      .catch(() => {});
  }, [mapState.bbox]);

  // Base map URLs
  const googleVectorUrl = "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
  const googleSatelliteUrl = "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
  const activeBaseUrl = layers.satellite ? googleSatelliteUrl : googleVectorUrl;

  return (
    <div className="w-full h-full relative z-0">
      <div className="absolute right-4 top-4 z-[1000] flex flex-col items-end">
        <button 
          onClick={() => setShowControls(!showControls)}
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border theme-transition"
          style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)', color: 'var(--z-text)' }}
        >
          <Layers className="w-5 h-5" />
        </button>

        {showControls && (
          <div className="mt-2 p-3 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right w-48"
            style={{ background: 'var(--z-nav-bg)', borderColor: 'var(--z-border)' }}>
            {openGroup ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--z-border)' }}>
                  <span className="text-[10px] font-black tracking-tight flex items-center gap-1.5" style={{ color: GROUP_META[openGroup].accent }}>
                    {React.createElement(GROUP_META[openGroup].icon, { className: 'w-3 h-3' })} {GROUP_META[openGroup].label}
                  </span>
                  <button onClick={() => setOpenGroup(null)} className="hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                </div>
                {LAYER_DEFS.filter(l => l.group === openGroup).map(l => (
                   <LayerButton key={l.id} label={l.label} icon={l.icon} active={layers[l.id]} onClick={() => setLayers(p => ({...p, [l.id]: !p[l.id]}))} color={l.color} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {Object.keys(GROUP_META).map(group => (
                  <button key={group} onClick={() => setOpenGroup(group)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    {React.createElement(GROUP_META[group].icon, { className: 'w-4 h-4', style: { color: GROUP_META[group].accent } })}
                    <span className="text-[10px] font-bold text-[var(--z-muted)]">{GROUP_META[group].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MapContainer center={[initialLat, initialLon]} zoom={9} style={{ height: '100%', width: '100%', background: isDark ? '#020617' : '#f0f2f5' }} zoomControl={false} attributionControl={false} maxZoom={18} doubleClickZoom={!onSyncLocation}>
        <MapEventsHandler onMoveEnd={handleMapMove} onDoubleClick={onSyncLocation} />
        <TileLayer url={activeBaseUrl} subdomains={['0','1','2','3']} maxZoom={18} maxNativeZoom={17} />
        
        {layers.radar && rainPath && (
          <TileLayer
            url={`https://tilecache.rainviewer.com${rainPath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65} maxNativeZoom={6} maxZoom={20}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}

        {layers.clouds && (
          <TileLayer
            url="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes_east_fulldisk_ch13/{z}/{x}/{y}.png"
            opacity={0.65} maxNativeZoom={6} maxZoom={20}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}

        {layers.cloudsVis && (
          <TileLayer
            url="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes_east_fulldisk_ch02/{z}/{x}/{y}.png"
            opacity={0.65} maxNativeZoom={6} maxZoom={20}
            eventHandlers={{ tileerror: (e) => { (e.tile as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; } }}
          />
        )}

        {/* ── Marcadores de Espacio Aéreo GeoJSON ── */}
        {airspaces.map((f, idx) => {
          const typeDef = LAYER_DEFS.find(l => l.filter && l.filter(f.properties));
          if (!typeDef || !layers[typeDef.id]) return null;
          return (
            <GeoJSON
              key={`airspace-${f.properties._id || f.properties.name || idx}`}
              data={f}
              style={{
                color: typeDef.color,
                weight: 1.5,
                fillColor: typeDef.color,
                fillOpacity: 0.2
              }}
            >
              <Tooltip sticky>
                <div className="font-medium text-[9px] bg-[var(--z-card)] text-[var(--z-text)] p-2 rounded border border-[var(--z-border)]">
                  <div className="font-bold tracking-wider" style={{ color: typeDef.color }}>{f.properties.name || 'Área Restringida'}</div>
                  <div className="mt-1">LÍMITE SUPERIOR: {f.properties.upperLimit?.value ? `${f.properties.upperLimit.value} ${f.properties.upperLimit.unit === 1 ? 'FT' : 'FL'}` : 'SFC'}</div>
                  <div className="">LÍMITE INFERIOR: {f.properties.lowerLimit?.value ? `${f.properties.lowerLimit.value} ${f.properties.lowerLimit.unit === 1 ? 'FT' : 'FL'}` : 'SFC'}</div>
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}

        {layers.airports && metars
          .filter((v, i, a) => a.findIndex(t => t.icaoId === v.icaoId) === i)
          .map((m) => (
            <SmartAirportMarker 
              key={m.icaoId} 
              metar={m} 
              taf={tafs.find(t => t.icaoId === m.icaoId)}
              notams={notams.filter(n => n.icaoId === m.icaoId)}
              airportInfo={coAirports[m.icaoId.toUpperCase()]}
            />
          ))}

        {layers.adsb && aircrafts.length === 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-[var(--z-card)] backdrop-blur-md px-4 py-2 rounded-xl border border-[var(--z-border)]">
            <span className="text-[10px] font-medium text-[var(--color-system-orange)]">SIN TRÁFICO ADS-B EN ESTA ZONA</span>
          </div>
        )}

        {layers.adsb && aircrafts.map((ac) => (
          <Marker key={ac.icao24} position={[ac.lat, ac.lon]} icon={createAircraftIcon(ac.trueTrack, String(ac.category))}>
            <Tooltip direction="right" offset={[10, 0]}>
              <div className="p-1.5 min-w-[140px] font-medium text-[10px]">
                <div className="flex justify-between items-center border-b border-[var(--z-border)] pb-1 mb-1">
                  <span className="text-[var(--z-muted)] font-bold">{ac.callsign}</span>
                  <span className="text-[9px]">#{ac.icao24.toUpperCase()}</span>
                </div>
                {(ac.registration || ac.aircraftType) && (
                  <div className="flex justify-between border-b border-[var(--z-border)] pb-1 mb-1">
                    {ac.registration && <span className="text-[var(--color-system-green)]">{ac.registration}</span>}
                    {ac.aircraftType && <span className="">{ac.aircraftType}</span>}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="">ALT</span>
                  <span>{Math.round((ac.baroAltitude ?? 0) * 3.28084)} FT</span>
                </div>
                {ac.velocity != null && ac.velocity > 0 && (
                  <div className="flex justify-between">
                    <span className="">GS</span>
                    <span>{Math.round(ac.velocity * 1.94384)} KT</span>
                  </div>
                )}
                {ac.verticalRate != null && ac.verticalRate !== 0 && (
                  <div className="flex justify-between">
                    <span className="">VS</span>
                    <span style={{ color: ac.verticalRate > 0 ? 'var(--color-system-green)' : 'var(--color-system-orange)' }}>
                      {ac.verticalRate > 0 ? '▲' : '▼'} {Math.abs(Math.round(ac.verticalRate * 196.85))} FPM
                    </span>
                  </div>
                )}
              </div>
            </Tooltip>
          </Marker>
        ))}

        <Marker position={[initialLat, initialLon]} icon={L.divIcon({
          className: 'home-icon',
          html: `<div style="width:16px; height:16px; background:white; border:3px solid ${HUD_COLORS.cyan}; border-radius:50%; box-shadow: 0 0 15px ${HUD_COLORS.cyan};"></div>`,
          iconSize: [16, 16]
        })}>
          <Tooltip permanent direction="bottom">MI UBICACIÓN</Tooltip>
        </Marker>
      </MapContainer>

      <ForecastBar8Day lat={mapState.lat} lon={mapState.lon} />

      {/* Crosshair Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center opacity-5">
        <div className="w-96 h-96 border border-white rounded-full"></div>
        <div className="absolute w-full h-[1px] bg-white"></div>
        <div className="absolute h-full w-[1px] bg-white"></div>
      </div>
    </div>
  );
}

function LayerButton({ label, icon: Icon, active, onClick, color }: {
  label: string, icon: LucideIcon, active: boolean, onClick: () => void, color?: string
}) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-2 py-1.5 rounded-xl transition-all duration-200 border ${active ? 'border-[var(--z-border)]' : 'border-transparent'}`}
      style={{ background: active ? 'var(--z-surface)' : 'transparent' }}>
      <Icon className={`w-4 h-4 transition-all ${active ? '' : 'filter grayscale  shadow-none'}`} 
        style={{ color: active ? (color || 'var(--z-cyan)') : 'var(--z-text)', filter: active ? `drop-shadow(0 0 4px ${color || 'var(--z-cyan)'}80)` : 'none' }} />
      <span className="text-[10px] font-bold tracking-tight" style={{ color: 'var(--z-text)', opacity: active ? 1 : 0.4 }}>{label}</span>
    </button>
  );
}
