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
    <div className="z-card w-full border border-[var(--z-border)] rounded-xl px-3 py-2.5 flex flex-col gap-2 shadow-sm theme-transition">
      <div className="flex items-center justify-between border-b border-[var(--z-border)] pb-1.5">
        <h2 className="text-[9px] font-bold text-[var(--z-muted)] tracking-widest uppercase">HUD Táctico</h2>
        <div className="flex gap-1.5 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[9px] text-green-500 font-bold tracking-widest">EN LINEA</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        
        {/* WIND */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[var(--z-muted)]">
            <Wind size={10} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Viento</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-light tracking-tight ${windColor}`}>{surfaceWind.speedStr}</span>
            <span className="text-[9px] text-[var(--z-muted)] font-medium uppercase">kt</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] text-[var(--z-muted)] uppercase tracking-wider">
            <Navigation size={8} style={{ transform: `rotate(${surfaceWind.angle}deg)` }} className="opacity-70" />
            <span className="font-medium">{surfaceWind.direction}</span>
          </div>
        </div>

        {/* GUSTS */}
        <div className="flex flex-col border-l border-[var(--z-border)] pl-2">
          <div className="flex items-center gap-1 text-[var(--z-muted)]">
            <Wind size={10} className="opacity-50" />
            <span className="text-[8px] font-bold uppercase tracking-wider">Ráfagas</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-light tracking-tight ${gustColor}`}>{maxGusts}</span>
            <span className="text-[9px] text-[var(--z-muted)] font-medium uppercase">kt</span>
          </div>
        </div>

        {/* SATS */}
        <div className="flex flex-col border-l border-[var(--z-border)] pl-2">
          <div className="flex items-center gap-1 text-[var(--z-muted)]">
            <Satellite size={10} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Satélites</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-light tracking-tight ${gpsColor}`}>{satellites}</span>
            <span className="text-[9px] text-[var(--z-muted)] font-medium uppercase">sat</span>
          </div>
        </div>

        {/* KP INDEX */}
        <div className="flex flex-col border-l border-[var(--z-border)] pl-2">
          <div className="flex items-center gap-1 text-[var(--z-muted)]">
            <KpIcon size={10} className={kpColor} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Kp</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-light tracking-tight ${kpColor}`}>{kpIndex.toFixed(1)}</span>
            <span className={`text-[8px] font-bold uppercase ${kpColor}`}>{kpStatus}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
