"use client";
// SKILL: ui-ux-pro-max | stitch-premium-ux-master
// CopilotStatus — Redesign Premium v4.0
// Stitch Design System: Zefyrio Avionics (Dark) / Zefyrio Horizon (Light)

import { ShieldAlert, ShieldCheck, ShieldX, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface CopilotStatusProps {
  status: string;
  aiMessage: string;
  profileLabel: string;
}

export default function CopilotStatus({ status, aiMessage, profileLabel }: CopilotStatusProps) {
  const { isDark } = useTheme();

  const cfg = {
    GO:      { Icon: ShieldCheck, accent: '#00ff66', label: 'GO — DESPEGUE AUTORIZADO',   bg: 'rgba(0,255,102,0.08)',   border: 'rgba(0,255,102,0.25)',   text: '#00ff66' },
    CAUTION: { Icon: ShieldAlert, accent: '#ffb800', label: 'CAUTION — PRECAUCIÓN',       bg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.30)',   text: '#ffb800' },
    'NO-GO': { Icon: ShieldX,    accent: '#ff0055', label: 'NO-GO — VUELO CANCELADO',    bg: 'rgba(255,0,85,0.08)',    border: 'rgba(255,0,85,0.30)',    text: '#ff0055' },
  }[status] ?? { Icon: ShieldAlert, accent: '#ffb800', label: status, bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.30)', text: '#ffb800' };

  const { Icon, accent, label, bg, border, text } = cfg;

  return (
    <section
      className="relative rounded-2xl overflow-hidden shrink-0 theme-transition"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {/* Accent glow blob */}
      <div
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: accent, opacity: 0.08, filter: 'blur(28px)' }}
      />

      <div className="relative p-5">
        {/* Status badge row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-0.5"
              style={{ color: 'var(--z-muted)' }}>
              Análisis {profileLabel}
            </p>
            <h2 className="text-lg font-black tracking-tight leading-none font-heading"
              style={{ color: text }}>
              {label}
            </h2>
          </div>
          <ChevronRight className="w-4 h-4 opacity-30 flex-shrink-0" style={{ color: text }} />
        </div>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: border }} />

        {/* AI Message */}
        <p className="text-[12px] leading-relaxed font-data" style={{ color: 'var(--z-muted)' }}>
          {aiMessage}
        </p>
      </div>
    </section>
  );
}
