"use client";
// GpsSatelliteStatus — Redesign Premium v4.0
// i18n-ready

import { Satellite } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface GpsSatelliteStatusProps {
  satellites: number;
  kpIndex: number;
  className?: string;
}

export default function GpsSatelliteStatus({ satellites, kpIndex, className = "" }: GpsSatelliteStatusProps) {
  const { t } = useTranslation();
  const MAX_SAT = 32;
  const pct = Math.min(satellites / MAX_SAT, 1);
  const circumference = 2 * Math.PI * 36;
  const strokeOffset = circumference * (1 - pct);

  // Kp color
  const kpColor = kpIndex >= 6 ? '#ff0055' : kpIndex >= 4 ? '#ffb800' : '#00ff66';
  const kpLabel = kpIndex >= 6 ? t('kp_storm') : kpIndex >= 4 ? t('kp_active') : t('kp_calm');

  return (
    <div
      className={`rounded-2xl flex flex-col items-center justify-between p-4 relative overflow-hidden theme-transition ${className}`}
      style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)', minHeight: '160px' }}
    >
      {/* Label */}
      <div className="w-full flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.16em] font-semibold"
          style={{ color: 'var(--z-muted)' }}>
          GPS
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff66' }} />
          <span className="text-[8px] font-data" style={{ color: '#00ff66' }}>{t('gps_sync')}</span>
        </div>
      </div>

      {/* Ring SVG */}
      <div className="relative w-[84px] h-[84px] my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
          {/* Track */}
          <circle cx="42" cy="42" r="36" fill="none"
            stroke="var(--z-surface)" strokeWidth="5" />
          {/* Progress */}
          <circle cx="42" cy="42" r="36" fill="none"
            stroke="#00ff66" strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px #00ff6688)', transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Satellite className="w-3.5 h-3.5 mb-0.5" style={{ color: '#00ff66' }} />
          <span className="text-[22px] font-black leading-none font-data"
            style={{ color: 'var(--z-text)' }}>
            {satellites}
          </span>
          <span className="text-[7px] font-data" style={{ color: 'var(--z-muted)' }}>{t('gps_sat')}</span>
        </div>
      </div>

      {/* Kp Index */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>Kp</span>
        <span className="text-[11px] font-black font-data" style={{ color: kpColor }}>
          {kpIndex.toFixed(1)} <span className="text-[8px] font-normal">{kpLabel}</span>
        </span>
      </div>
    </div>
  );
}
