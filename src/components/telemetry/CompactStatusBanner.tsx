"use client";
// CompactStatusBanner — single-line GO/CAUTION/NO-GO indicator.
// Tap opens AlertDetailModal with full AI reasoning.

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XOctagon, ChevronRight } from 'lucide-react';
import type { FlightStatus } from '@/store/useStore';
import AlertDetailModal from '@/components/ui/AlertDetailModal';

const STATUS_CONFIG = {
  'GO':      { label: 'GOOD TO FLY',   icon: CheckCircle,   color: 'var(--color-system-green)' },
  'CAUTION': { label: 'CAUTION',       icon: AlertTriangle, color: 'var(--color-system-orange)' },
  'NO-GO':   { label: 'NO-GO',         icon: XOctagon,      color: 'var(--color-system-red)' },
} as const;

interface CompactStatusBannerProps {
  status: FlightStatus;
  aiMessage: string;
  profileLabel: string;
}

export default function CompactStatusBanner({ status, aiMessage, profileLabel }: CompactStatusBannerProps) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition hover:brightness-110 active:scale-[0.99] shrink-0"
        style={{
          background: `${cfg.color}12`,
          border: `1px solid ${cfg.color}50`,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${cfg.color}25`, border: `1px solid ${cfg.color}` }}
        >
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[15px] font-black font-heading leading-tight" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
          <p className="text-[9px] tracking-tight" style={{ color: 'var(--z-text)' }}>
            {profileLabel} · tap para detalles
          </p>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
      </button>

      {open && (
        <AlertDetailModal
          open={true}
          onClose={() => setOpen(false)}
          icon={Icon}
          accent={cfg.color}
          badge={cfg.label}
          title={`Estado: ${cfg.label}`}
          subtitle={profileLabel}
          body={aiMessage}
        />
      )}
    </>
  );
}
