"use client";
// WindCompass — Redesign Premium v4.0
// i18n-ready

import { Navigation } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface WindCompassProps {
  surfaceWind: { speedStr: string; direction: string; angle: number; };
  maxGusts: string;
  className?: string;
}

export default function WindCompass({ surfaceWind, maxGusts, className = "" }: WindCompassProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`z-card rounded-[20px] flex flex-col items-center justify-between p-4 relative overflow-hidden theme-transition ${className}`}
      style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)', minHeight: '160px' }}
    >
      {/* Label */}
      <div className="w-full flex items-center justify-between">
        <span className="text-[9px] tracking-[0.16em] font-semibold"
          style={{ color: 'var(--z-muted)' }}>
          {t('wind_surface')}
        </span>
        <span className="text-[8px] font-data font-bold" style={{ color: 'var(--z-cyan)' }}>
          {surfaceWind.direction}
        </span>
      </div>

      {/* Compass */}
      <div className="relative w-[80px] h-[80px] my-1">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full"
          style={{ border: '1px solid var(--z-border)' }} />
        
        {/* Cardinal marks */}
        {[
          { label: 'N', top: '2px', left: '50%', transform: 'translateX(-50%)' },
          { label: 'S', bottom: '2px', left: '50%', transform: 'translateX(-50%)' },
          { label: 'E', right: '2px', top: '50%', transform: 'translateY(-50%)' },
          { label: 'W', left: '2px',  top: '50%', transform: 'translateY(-50%)' },
        ].map(({ label, ...style }) => (
          <span key={label} className="absolute text-[7px] font-black font-data"
            style={{ color: 'var(--z-muted)', ...style as React.CSSProperties }}>
            {label}
          </span>
        ))}

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-black font-data"
            style={{ color: 'var(--z-text)' }}>
            {surfaceWind.speedStr}
          </span>
        </div>

        {/* Rotating arrow */}
        <div
          className="absolute inset-0 transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${surfaceWind.angle}deg)` }}
        >
          <Navigation
            className="absolute"
            style={{
              width: '18px', height: '18px',
              color: 'var(--z-cyan)',
              filter: 'drop-shadow(0 0 5px var(--z-cyan))',
              top: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>

      {/* Gusts */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>{t('wind_gusts')}</span>
        <span className="text-[11px] font-black font-data" style={{ color: 'var(--color-system-orange)' }}>
          {maxGusts} kts
        </span>
      </div>
    </div>
  );
}
