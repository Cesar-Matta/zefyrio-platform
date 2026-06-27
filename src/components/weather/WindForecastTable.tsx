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
        <h3 className="text-sm font-medium tracking-tight" style={{ color: 'var(--z-text)' }}>Pronóstico de Viento (24h)</h3>
        <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--z-muted)' }}>Superficie vs 400ft (Nudos)</p>
      </div>
      
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max pb-2">
          {/* Header Row: Hours */}
          <div className="flex px-4 py-2" style={{ borderBottom: '1px solid var(--z-border)', background: 'var(--z-surface)' }}>
            <div className="w-20 shrink-0 text-[9px] uppercase font-bold tracking-widest flex items-center" style={{ color: 'var(--z-muted)' }}>Hora</div>
            {forecast.map((h, i) => {
              const dateObj = new Date(h.time);
              const hourStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={i} className="w-14 shrink-0 text-center text-[10px] font-medium font-data" style={{ color: 'var(--z-text)' }}>
                  {hourStr}
                </div>
              );
            })}
          </div>

          {/* Row: Dirección */}
          <div className="flex px-4 py-2.5 items-center" style={{ borderBottom: '1px dashed var(--z-border)' }}>
            <div className="w-20 shrink-0 text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-muted)' }}>Dir</div>
            {forecast.map((h, i) => (
              <div key={i} className="w-14 shrink-0 flex justify-center">
                <div style={{ transform: `rotate(${h.direction}deg)` }}>
                  <Navigation className="w-3.5 h-3.5" style={{ color: 'var(--z-cyan)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Row: SFC Wind */}
          <div className="flex px-4 py-2 items-center" style={{ borderBottom: '1px dashed var(--z-border)' }}>
            <div className="w-20 shrink-0 text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>Viento SFC</div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed10m);
              return (
                <div key={i} className="w-14 shrink-0 flex justify-center">
                  <span className="text-[11px] font-medium font-data px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
                    {Math.round(h.speed10m)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Row: SFC Gusts */}
          <div className="flex px-4 py-2 items-center" style={{ borderBottom: '1px dashed var(--z-border)' }}>
            <div className="w-20 shrink-0 text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-text)' }}>Ráfagas SFC</div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.gusts || 0);
              return (
                <div key={i} className="w-14 shrink-0 flex justify-center">
                  <span className="text-[11px] font-medium font-data px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
                    {Math.round(h.gusts || 0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Row: 400ft Wind */}
          <div className="flex px-4 py-2 items-center">
            <div className="w-20 shrink-0 text-[10px] font-medium tracking-wide" style={{ color: 'var(--z-cyan)' }}>Viento 400ft</div>
            {forecast.map((h, i) => {
              const cfg = getStateFromSpeed(h.speed120m);
              return (
                <div key={i} className="w-14 shrink-0 flex justify-center">
                  <span className="text-[11px] font-medium font-data px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
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
