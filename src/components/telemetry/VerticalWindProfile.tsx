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
        <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
             style={{ background: 'var(--z-glass-bg)', backdropFilter: 'var(--z-glass-blur)', WebkitBackdropFilter: 'var(--z-glass-blur)' }}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[75vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
               style={{ 
                 background: 'var(--z-card)', 
                 borderTop: '1px solid var(--z-border)',
                 borderLeft: '1px solid var(--z-border)',
                 borderRight: '1px solid var(--z-border)',
                 boxShadow: '0 -20px 50px rgba(0,0,0,0.3)'
               }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid var(--z-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)' }}>
                  <Wind className="w-4 h-4" style={{ color: 'var(--z-cyan)' }} />
                </div>
                <div>
                  <h3 className="text-base font-medium tracking-tight" style={{ color: 'var(--z-text)' }}>Pronóstico de Viento</h3>
                  <p className="text-xs font-normal tracking-wide flex items-center gap-1" style={{ color: 'var(--z-cyan)' }}>
                    {telemetryData?.locationName || "Próximos 7 días"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowForecast(false)}
                className="p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'var(--z-surface)', color: 'var(--z-text)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable Days) */}
            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3.5 custom-scrollbar">
              {days.map(day => {
                const isExpanded = expandedDay === day;
                const hours = forecastByDay[day];
                
                // Find max speed for this day to show a summary
                const maxDaySpeed = Math.max(...hours.map(h => h.speed120m));
                const dayCfg = getStateFromSpeed(maxDaySpeed);

                return (
                  <div key={day} className="rounded-xl overflow-hidden transition-all duration-300" 
                       style={{ 
                         border: `1px solid ${isExpanded ? 'var(--z-cyan)' : 'var(--z-border)'}`, 
                         background: isExpanded ? 'var(--z-bg)' : 'var(--z-surface)'
                       }}>
                    {/* Day Header */}
                    <button 
                      onClick={() => setExpandedDay(isExpanded ? null : day)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:opacity-80 transition-opacity"
                    >
                      <span className="font-medium text-xs tracking-tight" style={{ color: 'var(--z-text)' }}>{day}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-light tracking-tight" style={{ color: dayCfg.text }}>
                            {Math.round(maxDaySpeed)}
                          </span>
                          <span className="text-[9px] font-medium opacity-70" style={{ color: dayCfg.text }}>kt</span>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300" 
                             style={{ background: 'var(--z-bg)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <ChevronDown className="w-3 h-3" style={{ color: 'var(--z-muted)' }} />
                        </div>
                      </div>
                    </button>

                    {/* Hourly List */}
                    {isExpanded && (
                      <div className="p-2 pt-0">
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--z-border)', background: 'var(--z-card)' }}>
                          <div className="flex items-center px-4 py-2 border-b" style={{ borderColor: 'var(--z-border)', background: 'var(--z-surface)' }}>
                            <span className="w-14 text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>Hora</span>
                            <span className="w-8 text-center text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>Dir</span>
                            <span className="flex-1 text-center text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>SFC</span>
                            <span className="flex-1 text-center text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-muted)' }}>Ráfagas</span>
                            <span className="flex-1 text-right text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--z-cyan)' }}>400 FT</span>
                          </div>
                          <div className="flex flex-col">
                            {hours.map((h, idx) => {
                              const sfcCfg = getStateFromSpeed(h.speed10m);
                              const altCfg = getStateFromSpeed(h.speed120m);
                              const gustCfg = getStateFromSpeed(h.gusts || 0);
                              return (
                                <div key={idx} className="flex items-center px-4 py-2 hover:bg-black/5 transition-colors"
                                     style={{ borderBottom: idx < hours.length - 1 ? '1px solid var(--z-border)' : 'none' }}>
                                  <span className="w-14 text-[11px] font-normal font-data" style={{ color: 'var(--z-text)' }}>{h.hourStr}</span>
                                  
                                  {/* Dirección con flecha rotada */}
                                  <div className="w-8 flex justify-center">
                                    <div style={{ transform: `rotate(${h.direction}deg)` }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--z-muted)' }}>
                                        <path d="M12 2v20" />
                                        <path d="m17 7-5-5-5 5" />
                                      </svg>
                                    </div>
                                  </div>

                                  <span className="flex-1 text-center text-xs font-light font-data" style={{ color: sfcCfg.text }}>
                                    {Math.round(h.speed10m)}
                                  </span>
                                  <span className="flex-1 text-center text-[11px] font-medium font-data" style={{ color: gustCfg.text }}>
                                    {Math.round(h.gusts || 0)}
                                  </span>
                                  <span className="flex-1 text-right text-[13px] font-light font-data" style={{ color: altCfg.text }}>
                                    {Math.round(h.speed120m)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
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
