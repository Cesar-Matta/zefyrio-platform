"use client";
// SKILL: ui-ux-pro-max | stitch-premium-ux-master
// VerticalWindProfile — Redesign Premium v4.0

import { Wind } from "lucide-react";

interface VerticalWindProfileProps {
  verticalProfile: { alt: string; speed: number; state: string }[];
  className?: string;
}

const STATE_CONFIG = {
  critical: { bar: '#ff0055', text: '#ff0055', label: 'CRÍTICO' },
  warn:     { bar: '#ffb800', text: '#ffb800', label: 'ADVERTENCIA' },
  ok:       { bar: '#00b4cc', text: '#00b4cc', label: 'ACEPTABLE' },
  calm:     { bar: '#00ff66', text: '#00ff66', label: 'TRANQUILO' },
} as const;

export default function VerticalWindProfile({ verticalProfile, className = "" }: VerticalWindProfileProps) {
  const maxSpeed = Math.max(...verticalProfile.map(l => l.speed), 1);

  return (
    <section
      className={`rounded-2xl overflow-hidden shrink-0 theme-transition ${className}`}
      style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--z-border)' }}>
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5" style={{ color: 'var(--z-cyan)' }} />
          <span className="text-[9px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: 'var(--z-muted)' }}>
            Perfil Vertical del Viento
          </span>
        </div>
        <span className="text-[8px] font-data px-2 py-0.5 rounded-full"
          style={{ background: 'var(--z-surface)', color: 'var(--z-muted)', border: '1px solid var(--z-border)' }}>
          kts
        </span>
      </div>

      {/* Bars */}
      <div className="px-5 py-4 flex flex-col gap-3.5">
        {verticalProfile.map((layer, i) => {
          const cfg = STATE_CONFIG[layer.state as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.warn;
          const pct = Math.min((layer.speed / maxSpeed) * 100, 100);

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Altitude label */}
              <span className="w-12 text-right text-[10px] font-data font-semibold flex-shrink-0"
                style={{ color: 'var(--z-muted)' }}>
                {layer.alt}
              </span>

              {/* Track */}
              <div className="flex-1 h-3 rounded-full overflow-hidden relative"
                style={{ background: 'var(--z-surface)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cfg.bar}99, ${cfg.bar})`,
                    boxShadow: `0 0 8px ${cfg.bar}50`,
                  }}
                />
              </div>

              {/* Value */}
              <span className="w-7 text-right text-[15px] font-black font-data flex-shrink-0"
                style={{ color: cfg.text }}>
                {layer.speed}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
