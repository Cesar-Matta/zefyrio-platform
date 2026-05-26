"use client";
// AlertDetailModal — reusable bottom-sheet / center modal for full alert detail.
// Used by NoFlyZones, NotamAlert, SigmetAlert.

import { useEffect, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

interface Field {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

interface AlertDetailModalProps {
  open: boolean;
  onClose: () => void;
  icon: LucideIcon;
  accent: string;             // HEX color — sets border, badges, accents
  badge: string;              // small uppercase label, e.g. "RESTRINGIDO"
  title: string;              // big title, e.g. "SKE3"
  subtitle?: string;          // small caption under title, e.g. "RESTRICTED AREA · 28.9 nm"
  body: string;               // main long-form text
  fields?: Field[];           // optional key/value rows (effective date, altitude, etc.)
  raw?: string;               // optional raw payload (e.g. raw SIGMET METAR text)
  footer?: ReactNode;         // optional extra content slot
}

export default function AlertDetailModal({
  open, onClose, icon: Icon, accent, badge, title, subtitle, body, fields, raw, footer,
}: AlertDetailModalProps) {

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[78vh] flex flex-col rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{
          background: 'var(--z-surface)',
          border: `1px solid ${accent}40`,
          borderBottom: 'none',
          boxShadow: `0 -10px 40px ${accent}25`,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full opacity-30" style={{ background: 'var(--z-muted)' }} />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b" style={{ borderColor: `${accent}25` }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
              >
                {badge}
              </span>
            </div>
            <h2 className="text-lg font-black font-heading leading-tight" style={{ color: 'var(--z-text)' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-wider mt-0.5 font-mono opacity-70" style={{ color: 'var(--z-text)' }}>
                {subtitle}
              </p>
            )}
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

          {/* Main description */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--z-text)' }}>
              Descripción
            </h3>
            <p className="text-[12px] leading-relaxed font-mono" style={{ color: 'var(--z-text)' }}>
              {body}
            </p>
          </section>

          {/* Key/value fields */}
          {fields && fields.filter(f => f.value != null && f.value !== '').length > 0 && (
            <section className="rounded-xl p-3 grid grid-cols-2 gap-x-3 gap-y-2"
              style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
              {fields.filter(f => f.value != null && f.value !== '').map((f, i) => (
                <div key={i}>
                  <p className="text-[8px] uppercase tracking-widest opacity-50 mb-0.5" style={{ color: 'var(--z-text)' }}>
                    {f.label}
                  </p>
                  <p className={`text-[11px] ${f.mono ? 'font-mono' : ''}`} style={{ color: 'var(--z-text)' }}>
                    {f.value}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Raw payload (collapsible-style) */}
          {raw && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--z-text)' }}>
                Texto crudo
              </h3>
              <pre className="text-[10px] font-mono leading-relaxed p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-words"
                style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)', color: 'var(--z-text)' }}>
                {raw}
              </pre>
            </section>
          )}

          {footer}
        </div>
      </div>
    </div>
  );
}
