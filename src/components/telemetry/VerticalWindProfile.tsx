"use client";
// VerticalWindProfile — i18n-ready
import React, { useState } from "react";
import { Wind, CalendarDays, X, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useStore } from "@/store/useStore";

interface VerticalWindProfileProps {
  verticalProfile: { alt: string; speed: number; state: string }[];
  className?: string;
}

const STATE_CONFIG = {
  critical: { bar: 'var(--color-system-red)', text: 'var(--color-system-red)' },
  warn:     { bar: 'var(--color-system-orange)', text: 'var(--color-system-orange)' },
  ok:       { bar: '#00b4cc', text: '#00b4cc' },
  calm:     { bar: 'var(--color-system-green)', text: 'var(--color-system-green)' },
} as const;

export default function VerticalWindProfile({ verticalProfile, className = "" }: VerticalWindProfileProps) {
  const { t } = useTranslation();
  const { telemetryData } = useStore();
  const [showForecast, setShowForecast] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const maxSpeed = Math.max(...verticalProfile.map(l => l.speed), 1);

  // Group forecast by day
  const forecastByDay: Record<string, any[]> = {};
  if (telemetryData?.windForecast) {
    telemetryData.windForecast.forEach(hour => {
      const dateObj = new Date(hour.time);
      const dayKey = dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      if (!forecastByDay[dayKey]) forecastByDay[dayKey] = [];
      forecastByDay[dayKey].push({
        hourStr: dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        ...hour
      });
    });
  }

  const days = Object.keys(forecastByDay);

  const getStateFromSpeed = (speed: number) => {
    if (speed > 25) return STATE_CONFIG.critical;
    if (speed > 15) return STATE_CONFIG.warn;
    return STATE_CONFIG.calm;
  };

  return (
    <>
      {/* Main Card (Clickable) */}
      <section 
        className={`z-card rounded-[20px] overflow-hidden shrink-0 theme-transition cursor-pointer hover:border-[var(--z-cyan)] transition-colors ${className}`}
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
        onClick={() => setShowForecast(true)}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--z-border)' }}>
          <div className="flex items-center gap-2">
            <Wind className="w-3.5 h-3.5" style={{ color: 'var(--z-cyan)' }} />
            <span className="text-[9px] tracking-[0.18em] font-semibold"
              style={{ color: 'var(--z-muted)' }}>{t('telem_wind_profile')}</span>
          </div>
          <span className="text-[8px] font-data px-2 py-0.5 rounded-full"
            style={{ background: 'var(--z-surface)', color: 'var(--z-muted)', border: '1px solid var(--z-border)' }}>nudos</span>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3.5">
          {verticalProfile.map((layer, i) => {
            const cfg = STATE_CONFIG[layer.state as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.warn;
            const pct = Math.min((layer.speed / maxSpeed) * 100, 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-12 text-right text-[10px] font-data font-semibold flex-shrink-0"
                  style={{ color: 'var(--z-muted)' }}>{layer.alt}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden relative"
                  style={{ background: 'var(--z-surface)' }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${pct}%`, 
                      background: `linear-gradient(90deg, color-mix(in srgb, ${cfg.bar} 40%, transparent), ${cfg.bar})`, 
                      boxShadow: `0 0 8px color-mix(in srgb, ${cfg.bar} 50%, transparent)` 
                    }} />
                </div>
                <span className="w-7 text-right text-[15px] font-black font-data flex-shrink-0"
                  style={{ color: cfg.text }}>{layer.speed}</span>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-3 flex justify-center">
          <span className="text-[10px] font-medium flex items-center gap-1 opacity-70" style={{ color: 'var(--z-cyan)' }}>
            <CalendarDays className="w-3 h-3" /> Ver Pronóstico 7 Días
          </span>
        </div>
      </section>

      {/* Forecast Modal */}
      {showForecast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="z-card w-full max-w-md rounded-3xl border shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
               style={{ background: 'var(--z-background)', border: '1px solid var(--z-border)' }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--z-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--z-surface)' }}>
                  <Wind className="w-5 h-5" style={{ color: 'var(--z-cyan)' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pronóstico de Viento</h3>
                  <p className="text-xs opacity-70">Próximos 7 días (Nudos)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForecast(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 opacity-70" />
              </button>
            </div>

            {/* Modal Body (Scrollable Days) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {days.map(day => {
                const isExpanded = expandedDay === day;
                const hours = forecastByDay[day];
                
                // Find max speed for this day to show a summary
                const maxDaySpeed = Math.max(...hours.map(h => h.speed120m));
                const dayCfg = getStateFromSpeed(maxDaySpeed);

                return (
                  <div key={day} className="rounded-2xl border overflow-hidden transition-all" style={{ borderColor: 'var(--z-border)', background: 'var(--z-surface)' }}>
                    {/* Day Header */}
                    <button 
                      onClick={() => setExpandedDay(isExpanded ? null : day)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5"
                    >
                      <span className="font-semibold text-sm capitalize">{day}</span>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase opacity-70 block">Máx 400ft</span>
                          <span className="text-sm font-bold font-data" style={{ color: dayCfg.text }}>
                            {Math.round(maxDaySpeed)} kt
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                      </div>
                    </button>

                    {/* Hourly List */}
                    {isExpanded && (
                      <div className="bg-black/20 p-3 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--z-border)' }}>
                        <div className="flex text-[9px] uppercase font-bold opacity-50 px-2">
                          <span className="w-16">Hora</span>
                          <span className="flex-1 text-center">Superficie</span>
                          <span className="flex-1 text-right">400 ft</span>
                        </div>
                        {hours.map((h, idx) => {
                          const sfcCfg = getStateFromSpeed(h.speed10m);
                          const altCfg = getStateFromSpeed(h.speed120m);
                          return (
                            <div key={idx} className="flex items-center px-2 py-1.5 rounded-lg hover:bg-white/5">
                              <span className="w-16 text-xs font-data">{h.hourStr}</span>
                              <span className="flex-1 text-center text-xs font-data font-semibold" style={{ color: sfcCfg.text }}>
                                {Math.round(h.speed10m)}
                              </span>
                              <span className="flex-1 text-right text-xs font-data font-bold" style={{ color: altCfg.text }}>
                                {Math.round(h.speed120m)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
