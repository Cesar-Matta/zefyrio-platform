"use client";
// MetricCard — ultra-compact telemetry card.
// 3-column grid, no scroll, all key data visible at once.

import type { LucideIcon } from 'lucide-react';

type Tier = 'ok' | 'warn' | 'crit' | 'neutral';

const TIER_COLOR: Record<Tier, string> = {
  ok:      'var(--color-system-green)',
  warn:    'var(--color-system-orange)',
  crit:    'var(--color-system-red)',
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
  const accent = tier === 'neutral' ? 'var(--color-system-blue)' : valueColor;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`relative rounded-[16px] px-3 py-2.5 flex flex-col gap-1 overflow-hidden transition ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
      style={{
        background: 'var(--z-card)',
        border: '0.5px solid var(--z-border)',
        minHeight: '64px',
      }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />
        <span className="text-[11px] font-medium truncate" style={{ color: 'var(--z-muted)' }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className="text-[20px] font-semibold tracking-tight" style={{ color: valueColor }}>
          {value}
        </span>
        {unit && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--z-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Sub-line */}
      {sub && (
        <span className="text-[10px] font-medium truncate mt-0.5" style={{ color: 'var(--z-muted)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
