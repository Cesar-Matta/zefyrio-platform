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
  const getStateFromSpeed = (speed: number) => {
    if (speed > 25) return STATE_CONFIG.critical;
    if (speed > 15) return STATE_CONFIG.warn;
    return STATE_CONFIG.calm;
  };

  return (
    <section 
      className={`z-card rounded-xl overflow-hidden shrink-0 shadow-sm theme-transition ${className}`}
      style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
    >
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--z-border)' }}>
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5" style={{ color: 'var(--z-cyan)' }} />
          <span className="text-[10px] tracking-[0.15em] font-medium uppercase"
            style={{ color: 'var(--z-muted)' }}>{t('telem_wind_profile')}</span>
        </div>
        <span className="text-[8px] font-medium tracking-widest uppercase opacity-70"
          style={{ color: 'var(--z-muted)' }}>Nudos</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-3">
          {verticalProfile.map((layer, i) => {
            const cfg = STATE_CONFIG[layer.state as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.warn;
            const pct = Math.min((layer.speed / maxSpeed) * 100, 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-10 text-right text-[10px] font-medium flex-shrink-0 uppercase tracking-widest"
                  style={{ color: 'var(--z-muted)' }}>{layer.alt}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden relative"
                  style={{ background: 'var(--z-surface)' }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${pct}%`, 
                      background: cfg.bar, 
                      boxShadow: `0 0 8px color-mix(in srgb, ${cfg.bar} 50%, transparent)` 
                    }} />
                </div>
                <span className="w-7 text-right text-sm font-light tabular-nums tracking-tight flex-shrink-0"
                  style={{ color: cfg.text }}>{layer.speed}</span>
              </div>
            );
          })}
        </div>
      </section>
    );
}
