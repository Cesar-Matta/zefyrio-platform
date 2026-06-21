"use client";
// StatusFactorsModal — opens when CopilotStatus is tapped.
// Shows AI message + table of every factor (value, threshold, pass/fail).

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, XOctagon, Minus, ShieldCheck, ShieldAlert, ShieldX, type LucideIcon } from 'lucide-react';
import type { FlightStatus, TelemetryData } from '@/store/useStore';
import { computeFactors, type FactorTier } from '@/lib/api/factors';

const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; icon: LucideIcon }> = {
  'GO':      { label: 'GOOD TO FLY', color: 'var(--color-system-green)', icon: ShieldCheck },
  'CAUTION': { label: 'CAUTION',     color: 'var(--color-system-orange)', icon: ShieldAlert },
  'NO-GO':   { label: 'NO-GO',       color: 'var(--color-system-red)', icon: ShieldX },
};

const TIER_VISUAL: Record<FactorTier, { bg: string; color: string; icon: LucideIcon }> = {
  good: { bg: 'rgba(0,255,102,0.10)',  color: 'var(--color-system-green)', icon: CheckCircle  },
  warn: { bg: 'rgba(255,184,0,0.10)',  color: 'var(--color-system-orange)', icon: AlertTriangle },
  bad:  { bg: 'rgba(255,0,85,0.10)',   color: 'var(--color-system-red)', icon: XOctagon     },
  info: { bg: 'transparent',            color: '#94a3b8', icon: Minus        },
};

interface StatusFactorsModalProps {
  open: boolean;
  onClose: () => void;
  status: FlightStatus;
  aiMessage: string;
  profileLabel: string;
  data: TelemetryData;
}

export default function StatusFactorsModal({ open, onClose, status, aiMessage, profileLabel, data }: StatusFactorsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const portalEl = typeof document !== 'undefined' ? document.getElementById('phone-modal-root') : null;
  if (!portalEl) return null;

  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const factors = computeFactors(data);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 flex items-end justify-center animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85%] flex flex-col rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{
          background: 'var(--z-surface)',
          border: `1px solid ${cfg.color}40`,
          borderBottom: 'none',
          boxShadow: `0 -10px 40px ${cfg.color}25`,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--z-muted)' }} />
        </div>

        {/* Header — large status banner */}
        <div className="px-4 pb-3 pt-2 flex items-center gap-3" style={{ background: `${cfg.color}15`, borderBottom: `1px solid ${cfg.color}30` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}25`, border: `1px solid ${cfg.color}` }}>
            <StatusIcon className="w-6 h-6" style={{ color: cfg.color }} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] tracking-tight" style={{ color: 'var(--z-text)' }}>
              Análisis · {profileLabel}
            </p>
            <h2 className="text-xl font-black font-heading leading-tight" style={{ color: cfg.color }}>
              {cfg.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" style={{ color: 'var(--z-text)' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

          {/* AI explanation */}
          <section>
            <h3 className="text-[10px] font-bold tracking-tight mb-2" style={{ color: 'var(--z-text)' }}>
              Explicación
            </h3>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--z-text)' }}>
              {aiMessage}
            </p>
          </section>

          {/* Factors table */}
          <section>
            <h3 className="text-[10px] font-bold tracking-tight mb-2" style={{ color: 'var(--z-text)' }}>
              Factores
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--z-border)' }}>
              {/* Header row */}
              <div className="grid grid-cols-[1.4fr_1fr_0.9fr_0.4fr] gap-2 px-3 py-2 text-[9px] font-bold tracking-tight"
                style={{ background: 'var(--z-card)', color: 'var(--z-muted)' }}>
                <span>Factor</span>
                <span className="text-right">Valor</span>
                <span className="text-right">Límite</span>
                <span className="text-center">OK</span>
              </div>
              {factors.map((f, i) => {
                const v = TIER_VISUAL[f.tier];
                const IconV = v.icon;
                return (
                  <div
                    key={f.label}
                    className="grid grid-cols-[1.4fr_1fr_0.9fr_0.4fr] gap-2 px-3 py-2 items-center text-[11px]"
                    style={{
                      background: f.tier === 'info' ? 'transparent' : v.bg,
                      borderTop: i === 0 ? 'none' : '1px solid var(--z-border)',
                      color: 'var(--z-text)',
                    }}
                  >
                    <span className="truncate">{f.label}</span>
                    <span className="text-right font-medium font-bold" style={{ color: v.color }}>{f.value}</span>
                    <span className="text-right font-medium text-[10px]">{f.threshold}</span>
                    <span className="flex justify-center">
                      <IconV className="w-3.5 h-3.5" style={{ color: v.color }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Color legend */}
          <section className="rounded-xl p-3 grid grid-cols-2 gap-2"
            style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
            <LegendItem icon={CheckCircle}   color="var(--color-system-green)" label="OK" />
            <LegendItem icon={AlertTriangle} color="var(--color-system-orange)" label="Precaución" />
            <LegendItem icon={XOctagon}      color="var(--color-system-red)" label="Crítico" />
            <LegendItem icon={Minus}         color="#94a3b8" label="Informativo" />
          </section>

        </div>
      </div>
    </div>
  );

  return createPortal(content, portalEl);
}

function LegendItem({ icon: Icon, color, label }: { icon: LucideIcon; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[10px]" style={{ color: 'var(--z-text)' }}>{label}</span>
    </div>
  );
}
