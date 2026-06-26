import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, Navigation, Satellite, Wind } from 'lucide-react';
import { SurfaceWind } from '@/store/useStore';

interface TacticalTopBarProps {
  satellites: number;
  kpIndex: number;
  surfaceWind: SurfaceWind;
  maxGusts: string;
}

export default function TacticalTopBar({ satellites, kpIndex, surfaceWind, maxGusts }: TacticalTopBarProps) {
  // Determine Kp status
  let kpStatus = 'OK';
  let kpColor = 'text-green-500';
  let KpIcon = ShieldCheck;
  if (kpIndex > 4) {
    kpStatus = 'PELIGRO';
    kpColor = 'text-red-500';
    KpIcon = ShieldAlert;
  } else if (kpIndex >= 3) {
    kpStatus = 'ALERTA';
    kpColor = 'text-yellow-500';
    KpIcon = Shield;
  }

  // Determine Wind status (assume max 15 kt for drone safety)
  const windSpeed = parseFloat(surfaceWind.speedStr || '0');
  let windColor = 'text-green-500';
  if (windSpeed > 15) windColor = 'text-red-500';
  else if (windSpeed > 10) windColor = 'text-yellow-500';

  const gustSpeed = parseFloat(maxGusts || '0');
  let gustColor = 'text-green-500';
  if (gustSpeed > 20) gustColor = 'text-red-500';
  else if (gustSpeed > 15) gustColor = 'text-yellow-500';

  let gpsColor = 'text-green-500';
  if (satellites < 8) gpsColor = 'text-red-500';
  else if (satellites < 12) gpsColor = 'text-yellow-500';

  return (
    <div className="z-card w-full border border-[var(--z-border)] rounded-2xl p-4 flex flex-col gap-3 shadow-sm theme-transition">
      <div className="flex items-center justify-between border-b border-[var(--z-border)] pb-2">
        <h2 className="text-[10px] font-bold text-[var(--z-muted)] tracking-widest uppercase">HUD Táctico</h2>
        <div className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] text-green-500 font-bold tracking-widest">EN LINEA</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* WIND */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[var(--z-muted)]">
            <Wind size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Viento</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${windColor}`}>{surfaceWind.speedStr}</span>
            <span className="text-xs text-[var(--z-muted)] font-bold">kt</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--z-muted)]">
            <Navigation size={10} style={{ transform: `rotate(${surfaceWind.angle}deg)` }} className="text-[var(--z-muted)] opacity-80" />
            <span className="font-bold">{surfaceWind.direction}</span>
          </div>
        </div>

        {/* GUSTS */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[var(--z-muted)]">
            <Wind size={12} className="opacity-50" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Ráfagas</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${gustColor}`}>{maxGusts}</span>
            <span className="text-xs text-[var(--z-muted)] font-bold">kt</span>
          </div>
        </div>

        {/* SATS */}
        <div className="flex flex-col gap-1 border-t border-[var(--z-border)] pt-2 md:border-t-0 md:pt-0 md:border-l md:pl-4">
          <div className="flex items-center gap-1.5 text-[var(--z-muted)]">
            <Satellite size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Satelites</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${gpsColor}`}>{satellites}</span>
            <span className="text-xs text-[var(--z-muted)] font-bold">sat</span>
          </div>
        </div>

        {/* KP INDEX */}
        <div className="flex flex-col gap-1 border-t border-[var(--z-border)] pt-2 md:border-t-0 md:pt-0">
          <div className="flex items-center gap-1.5 text-[var(--z-muted)]">
            <KpIcon size={12} className={kpColor} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Índice Kp</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${kpColor}`}>{kpIndex.toFixed(1)}</span>
            <span className={`text-xs font-bold ${kpColor}`}>{kpStatus}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
