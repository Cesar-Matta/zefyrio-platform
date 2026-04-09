"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, 
  Wind, 
  CloudRain, 
  Plane, 
  Navigation, 
  Map as MapIcon, 
  Zap, 
  AlertTriangle,
  Radio,
  Cloud,
  Satellite,
  Clock,
  Skull,
  Maximize
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import SmartAirportMarker from './SmartAirportMarker';
import ForecastBar8Day from '../weather/ForecastBar8Day';

// ─── Icons & Components ──────────────────────────────────────────────────────

const HUD_COLORS = {
  cyan: '#00F0FF',
  green: '#00FF66',
  amber: '#FFB800',
  red: '#FF0055',
  purple: '#8B5CF6',
};

function MapEventsHandler({ onMoveEnd }: { onMoveEnd: (lat: number, lon: number, zoom: number, bbox: string) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      onMoveEnd(center.lat, center.lng, zoom, bbox);
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

// ─── Main Component ──────────────────────────────────────────────────────────

interface LayerState {
  satellite: boolean;
  radar: boolean;
  wind: boolean;
  adsb: boolean;
  metar: boolean;
  airports: boolean;
  radio: boolean;
  notams: boolean;
  nofly: boolean;
  clouds: boolean;
}

export default function InteractiveMapView({ initialLat, initialLon }: { initialLat: number, initialLon: number }) {
  const { isDark } = useTheme();
  const [layers, setLayers] = useState<LayerState>({
    satellite: true, radar: true, wind: false, adsb: true,
    metar: true, airports: false, radio: false, notams: true,
    nofly: true, clouds: true,
  });
  
  const [showControls, setShowControls] = useState(true);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [notams, setNotams] = useState<any[]>([]);
  const [metars, setMetars] = useState<any[]>([]);
  const [rainTimestamp, setRainTimestamp] = useState<number | null>(null);
  
  const [mapState, setMapState] = useState({
    lat: initialLat, lon: initialLon, zoom: 9,
    bbox: `${initialLat-1},${initialLon-1},${initialLat+1},${initialLon+1}`
  });

  // Fetch RainViewer Timestamp
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar?.past?.length > 0) {
          setRainTimestamp(data.radar.past[data.radar.past.length - 1].time);
        }
      })
      .catch(err => console.error("RainViewer TS Error:", err));
  }, []);

  const handleMapMove = useCallback((lat: number, lon: number, zoom: number, bbox: string) => {
    setMapState({ lat, lon, zoom, bbox });
  }, []);

  // Sync ADS-B
  useEffect(() => {
    if (!layers.adsb) return;
    const fetchAdsb = async () => {
      try {
        const res = await fetch(`/api/adsb?bbox=${mapState.bbox}`);
        const data = await res.json();
        if (data.aircraft) setAircrafts(data.aircraft);
      } catch (err) { console.error("ADS-B Fetch Error:", err); }
    };
    fetchAdsb();
    const interval = setInterval(fetchAdsb, 15000);
    return () => clearInterval(interval);
  }, [layers.adsb, mapState.bbox]);

  // Sync NOTAMs & METARs
  useEffect(() => {
    const fetchAeroData = async () => {
      try {
        const [nRes, mRes] = await Promise.all([
          fetch(`/api/notams?lat=${mapState.lat}&lon=${mapState.lon}&radius=80`),
          fetch(`/api/aero?lat=${mapState.lat}&lon=${mapState.lon}`)
        ]);
        const nData = await nRes.json();
        const mData = await mRes.json();
        if (nData.items) setNotams(nData.items);
        if (mData.metar) setMetars(mData.metar);
      } catch (err) { console.error("Aero Fetch Error:", err); }
    };
    fetchAeroData();
  }, [mapState.lat, mapState.lon]);

  const baseMapUrl = layers.satellite 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : isDark 
      ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full relative z-0">
      
      {/* HUD Layer Control */}
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
            <div className="flex flex-col gap-2">
              <LayerButton label="Satélite Visual" icon={Satellite} active={layers.satellite} onClick={() => setLayers(p => ({...p, satellite: !p.satellite}))} />
              <LayerButton label="Nubes Infrarrojas" icon={Cloud} active={layers.clouds} onClick={() => setLayers(p => ({...p, clouds: !p.clouds}))} color={HUD_COLORS.purple} />
              <LayerButton label="Radar Precipit." icon={CloudRain} active={layers.radar} onClick={() => setLayers(p => ({...p, radar: !p.radar}))} />
              <LayerButton label="Tráfico ADS-B" icon={Plane} active={layers.adsb} onClick={() => setLayers(p => ({...p, adsb: !p.adsb}))} />
              <LayerButton label="Aeropuertos OACI" icon={Navigation} active={layers.metar} onClick={() => setLayers(p => ({...p, metar: !p.metar}))} />
              <hr className="border-white/5 my-1" />
              <LayerButton label="Zonas WAR (NOTAM)" icon={Zap} active={layers.notams} onClick={() => setLayers(p => ({...p, notams: !p.notams}))} color={HUD_COLORS.amber} />
              <LayerButton label="No-Fly Zones" icon={Skull} active={layers.nofly} onClick={() => setLayers(p => ({...p, nofly: !p.nofly}))} color={HUD_COLORS.red} />
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 z-[1000]">
         <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 font-mono text-[9px] text-white flex items-center gap-2">
           <Clock className="w-3.5 h-3.5 text-cyber-cyan" />
           <span>{mapState.lat.toFixed(4)}, {mapState.lon.toFixed(4)} • ZOOM {mapState.zoom} • {new Date().toLocaleTimeString()}</span>
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
         </div>
      </div>

      <MapContainer 
        center={[initialLat, initialLon]} zoom={9} 
        style={{ height: '100%', width: '100%', background: isDark ? '#020617' : '#f0f2f5' }}
        zoomControl={false} attributionControl={false}
        maxZoom={18}
      >
        <MapEventsHandler onMoveEnd={handleMapMove} />
        
        <TileLayer 
          url={baseMapUrl} 
          maxZoom={18} 
          maxNativeZoom={17} // Scale zoom 17 tiles if 18 doesn't exist
        />
        
        {/* RainViewer Layers with Dynamic Timestamp */}
        {layers.clouds && rainTimestamp && (
          <TileLayer 
            url={`https://tilecache.rainviewer.com/v2/satellite/${rainTimestamp}/256/{z}/{x}/{y}/2/0_0.png`}
            opacity={0.4}
            maxNativeZoom={10} // Higher scaling for low-res satellite
            maxZoom={18}
          />
        )}

        {layers.radar && rainTimestamp && (
          <TileLayer 
            url={`https://tilecache.rainviewer.com/v2/radar/${rainTimestamp}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.6}
            maxNativeZoom={15} 
            maxZoom={18}
          />
        )}

        {layers.metar && metars.map((m) => <SmartAirportMarker key={m.icaoId} metar={m} />)}

        {layers.notams && notams.map((notam, idx) => {
          const geom = notam.properties?.geometry;
          if (geom?.type === "Point") {
            return (
              <Marker key={`notam-${idx}`} position={[geom.coordinates[1], geom.coordinates[0]]}
                icon={L.divIcon({
                  className: 'notam-icon',
                  html: `<div style="width:14px; height:14px; border:2px solid ${HUD_COLORS.red}; border-radius:50%; background:${HUD_COLORS.red}40; animation: pulse 2s infinite;"></div>`,
                  iconSize: [14, 14]
                })}>
                <Popup><div className="max-w-[200px] text-[10px] font-mono p-1">
                  <div className="font-bold text-red-500 mb-1">WARNING: NOTAM {notam.properties.notamNumber}</div>
                  {notam.properties.notamEvent.text}
                </div></Popup>
              </Marker>
            );
          }
          return null;
        })}

        {layers.adsb && aircrafts.map((ac) => (
          <Marker key={ac.icao24} position={[ac.lat, ac.lon]} icon={createAircraftIcon(ac.trueTrack, String(ac.category))}>
            <Tooltip direction="right" offset={[10, 0]}>
              <div className="p-1 min-w-[120px] font-mono text-[10px]">
                <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-1">
                  <span className="text-cyber-cyan font-bold">{ac.callsign}</span>
                  <span className="text-[9px] opacity-60">#{ac.icao24.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">ALT</span>
                  <span>{Math.round(ac.baroAltitude * 3.28084)} FT</span>
                </div>
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
  label: string, icon: any, active: boolean, onClick: () => void, color?: string 
}) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-2 py-1.5 rounded-xl transition-all duration-200 border ${active ? 'border-white/10' : 'border-transparent'}`}
      style={{ background: active ? 'var(--z-surface)' : 'transparent' }}>
      <Icon className={`w-4 h-4 transition-all ${active ? '' : 'filter grayscale opacity-30 shadow-none'}`} 
        style={{ color: active ? (color || 'var(--z-cyan)') : 'var(--z-text)', filter: active ? `drop-shadow(0 0 4px ${color || 'var(--z-cyan)'}80)` : 'none' }} />
      <span className="text-[10px] font-bold tracking-tight" style={{ color: 'var(--z-text)', opacity: active ? 1 : 0.4 }}>{label}</span>
    </button>
  );
}
