"use client";
// FlightWindow (Solar Window) — Redesign Premium v4.0
// i18n-ready

import { Sunrise, Sunset } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface FlightWindowProps {
  sun: {
    sunrise: string;
    sunset: string;
    progressPercent: number;
  };
  className?: string;
}

export default function FlightWindow({ sun, className = "" }: FlightWindowProps) {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, sun.progressPercent));
  const isDaytime = pct > 0 && pct < 100;
  const progressColor = pct > 80 ? '#f97316' : pct > 60 ? '#fbbf24' : pct > 20 ? '#facc15' : '#f97316';

  return (
    <section 
      className={`z-card rounded-[20px] p-4 col-span-2 overflow-hidden theme-transition ${className}`}
      style={{
 background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sunrise className="w-3 h-3" style={{ color: '#fbbf24' }} />
          <span className="text-[9px] tracking-[0.16em] font-semibold"
            style={{ color: 'var(--z-muted)' }}>
            {t('telem_flight_window')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isDaytime ? 'var(--color-system-green)' : '#6366f1' }}
          />
          <span className="text-[8px] font-data"
            style={{ color: isDaytime ? 'var(--color-system-green)' : '#6366f1' }}>
            {isDaytime ? t('telem_daytime') : t('telem_nighttime')}
          </span>
        </div>
      </div>

      {/* Timeline row */}
      <div className="flex items-center gap-3">
        {/* Sunrise */}
        <div className="flex flex-col items-center flex-shrink-0">
          <Sunrise className="w-4 h-4 mb-1" style={{ color: '#fbbf24' }} />
          <span className="text-[13px] font-black font-data" style={{ color: 'var(--z-text)' }}>
            {sun.sunrise}
          </span>
        </div>

        {/* Progress track */}
        <div className="flex-1 relative">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--z-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-[2000ms] ease-out"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #f97316, #fbbf24, #facc15, #818cf8)',
              }}
            />
          </div>
          {/* Sun marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-[2000ms] ease-out"
            style={{
              left: `calc(${pct}% - 8px)`,
              background: progressColor,
              boxShadow: `0 0 10px ${progressColor}80`,
            }}
          >
            <span className="text-[6px]">☀</span>
          </div>
        </div>

        {/* Sunset */}
        <div className="flex flex-col items-center flex-shrink-0">
          <Sunset className="w-4 h-4 mb-1" style={{ color: '#818cf8' }} />
          <span className="text-[13px] font-black font-data" style={{ color: 'var(--z-text)' }}>
            {sun.sunset}
          </span>
        </div>
      </div>
    </section>
  );
}
