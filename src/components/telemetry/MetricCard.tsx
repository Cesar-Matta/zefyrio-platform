"use client";
// MetricCard — ultra-compact telemetry card.
// 3-column grid, no scroll, all key data visible at once.

import type { LucideIcon } from 'lucide-react';

type Tier = 'ok' | 'warn' | 'crit' | 'neutral';

const TIER_COLOR: Record<Tier, string> = {
  ok:      '#00ff66',
  warn:    '#ffb800',
  crit:    '#ff0055',
  neutral: 'var(--z-text)',
};

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;          // optional second line below value
  tier?: Tier;           // colors the value
  onClick?: () => void;  // makes card tappable (shows pointer cursor)
}

export default function MetricCard({ icon: Icon, label, value, unit, sub, tier = 'neutral', onClick }: MetricCardProps) {
  const valueColor = TIER_COLOR[tier];
  const accent = tier === 'neutral' ? 'var(--z-muted)' : valueColor;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`relative rounded-xl px-2.5 py-2 flex flex-col gap-0.5 overflow-hidden transition ${onClick ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''}`}
      style={{
        background: 'var(--z-card)',
        border: '1px solid var(--z-border)',
        minHeight: '64px',
      }}
    >
      {/* Top tier strip */}
      {tier !== 'neutral' && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: valueColor }} />
      )}

      {/* Label row */}
      <div className="flex items-center gap-1">
        <Icon className="w-2.5 h-2.5 shrink-0" style={{ color: accent }} />
        <span className="text-[8px] font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--z-muted)' }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className="text-[18px] font-black font-data" style={{ color: valueColor }}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-semibold" style={{ color: 'var(--z-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Sub-line */}
      {sub && (
        <span className="text-[8px] font-mono truncate" style={{ color: 'var(--z-muted)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
