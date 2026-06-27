"use client";
import React from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useStore } from "@/store/useStore";
import { Navigation } from "lucide-react";

const STATE_CONFIG = {
  critical: { color: 'var(--color-system-red)' },
  warn:     { color: 'var(--color-system-orange)' },
  calm:     { color: 'var(--color-system-green)' },
} as const;

export default function WindForecastTable() {
  const { t } = useTranslation();
  const { telemetryData } = useStore();

  if (!telemetryData?.windForecast || telemetryData.windForecast.length === 0) {
    return null;
  }

  // We take the next 24 hours for the horizontal table
  const forecast = telemetryData.windForecast.slice(0, 24);

  const getStateFromSpeed = (speed: number) => {
    if (speed > 25) return STATE_CONFIG.critical;
    if (speed > 15) return STATE_CONFIG.warn;
    return STATE_CONFIG.calm;
  };

  return (
    <div className="z-card rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--z-border)' }}>
        <h3 className="text-sm font-medium tracking-tight" style={{ color: 'var(--z-text)' }}>Pronóstico de Viento</h3>
        <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--z-muted)' }}>Superficie vs 400ft (Nudos)</p>
      </div>
      
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-max pb-1 flex flex-col">
          
          {/* Row: HORA */}
          <div className="flex items-stretch border-b border-[var(--z-border)] bg-[var(--z-surface)]">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-[var(--z-surface)] px-2 py-1 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[8px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>Hora</span>
            </div>
            {forecast.map((h, i) => {
              const dateObj = new Date(h.time);
              const hr = dateObj.getHours();
              const ampm = hr >= 12 ? 'pm' : 'am';
              const hr12 = hr % 12 || 12;
              return (
                <div key={i} className="w-8 shrink-0 py-0.5 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--z-text)', lineHeight: '1' }}>{hr12}</span>
                  <span className="text-[7px] font-bold uppercase" style={{ color: 'var(--z-muted)', lineHeight: '1', marginTop: '1px' }}>{ampm}</span>
                </div>
              );
            })}
          </div>

          {/* Row: Dirección */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-[var(--z-card)] px-2 py-0.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[9px] font-medium tracking-wide" style={{ color: 'var(--z-muted)' }}>Dir</span>
            </div>
            {forecast.map((h, i) => (
              <div key={i} className="w-8 shrink-0 py-0.5 flex items-center justify-center">
                <div style={{ transform: `rotate(${h.direction}deg)` }}>
                  <Navigation className="w-2.5 h-2.5" style={{ color: 'var(--z-muted)', opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Row: Viento SFC */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-[var(--z-card)] px-2 py-0.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[9px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>Viento</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed10m);
              return (
                <div key={i} className="w-8 shrink-0 py-0.5 flex items-center justify-center">
                  <span className="text-[11px] font-semibold font-data" style={{ color: cfg.color }}>
                    {Math.round(h.speed10m)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Row: Ráfagas SFC */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-[var(--z-card)] px-2 py-0.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[9px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>Ráfagas</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.gusts || 0);
              return (
                <div key={i} className="w-8 shrink-0 py-0.5 flex items-center justify-center">
                  <span className="text-[11px] font-semibold font-data" style={{ color: cfg.color }}>
                    {Math.round(h.gusts || 0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Row: Viento 400ft */}
          <div className="flex items-stretch">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-[var(--z-card)] px-2 py-0.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[9px] font-medium tracking-wide" style={{ color: 'var(--color-system-blue)' }}>400ft</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed120m);
              return (
                <div key={i} className="w-8 shrink-0 py-0.5 flex items-center justify-center">
                  <span className="text-[11px] font-semibold font-data" style={{ color: cfg.color }}>
                    {Math.round(h.speed120m)}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
