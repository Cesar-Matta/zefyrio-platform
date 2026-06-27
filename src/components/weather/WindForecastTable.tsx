"use client";
import React from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useStore } from "@/store/useStore";
import { Navigation } from "lucide-react";

const STATE_CONFIG = {
  critical: { bg: 'var(--color-system-red)', text: '#fff' },
  warn:     { bg: 'var(--color-system-orange)', text: '#fff' },
  calm:     { bg: 'var(--color-system-green)', text: '#fff' },
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
            <div className="sticky left-0 z-10 w-24 shrink-0 bg-[var(--z-surface)] px-3 py-2 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>Hora</span>
            </div>
            {forecast.map((h, i) => {
              const dateObj = new Date(h.time);
              const hr = dateObj.getHours();
              const ampm = hr >= 12 ? 'pm' : 'am';
              const hr12 = hr % 12 || 12;
              return (
                <div key={i} className="w-12 shrink-0 py-1.5 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold" style={{ color: 'var(--z-text)' }}>{hr12}</span>
                  <span className="text-[8px] font-bold uppercase" style={{ color: 'var(--z-muted)' }}>{ampm}</span>
                </div>
              );
            })}
          </div>

          {/* Row: Dirección */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-24 shrink-0 bg-[var(--z-card)] px-3 py-2.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-muted)' }}>Dirección</span>
            </div>
            {forecast.map((h, i) => (
              <div key={i} className="w-12 shrink-0 flex items-center justify-center">
                <div style={{ transform: `rotate(${h.direction}deg)` }}>
                  <Navigation className="w-3.5 h-3.5" style={{ color: 'var(--z-muted)', opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Row: Viento SFC */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-24 shrink-0 bg-[var(--z-card)] px-3 py-2.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>SFC Viento</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed10m);
              return (
                <div key={i} className="w-12 shrink-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
                    <span className="text-[10px] font-bold font-data" style={{ color: cfg.text }}>
                      {Math.round(h.speed10m)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row: Ráfagas SFC */}
          <div className="flex items-stretch border-b border-[var(--z-border)] border-opacity-50">
            <div className="sticky left-0 z-10 w-24 shrink-0 bg-[var(--z-card)] px-3 py-2.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>SFC Ráfagas</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.gusts || 0);
              return (
                <div key={i} className="w-12 shrink-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
                    <span className="text-[10px] font-bold font-data" style={{ color: cfg.text }}>
                      {Math.round(h.gusts || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row: Viento 400ft */}
          <div className="flex items-stretch">
            <div className="sticky left-0 z-10 w-24 shrink-0 bg-[var(--z-card)] px-3 py-2.5 flex items-center shadow-[4px_0_8px_rgba(0,0,0,0.03)] border-r border-[var(--z-border)]">
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--color-system-blue)' }}>400ft Viento</span>
            </div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed120m);
              return (
                <div key={i} className="w-12 shrink-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
                    <span className="text-[10px] font-bold font-data" style={{ color: cfg.text }}>
                      {Math.round(h.speed120m)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
