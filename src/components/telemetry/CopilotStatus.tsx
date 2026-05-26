"use client";
// CopilotStatus — GO/CAUTION/NO-GO status card.
// Tap opens StatusFactorsModal with full factor breakdown.

import { useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StatusFactorsModal from "./StatusFactorsModal";
import type { TelemetryData, FlightStatus } from "@/store/useStore";

interface CopilotStatusProps {
  status: FlightStatus;
  aiMessage: string;
  profileLabel: string;
  data: TelemetryData;       // full telemetry — used by the factors modal
}

export default function CopilotStatus({ status, aiMessage, profileLabel, data }: CopilotStatusProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const cfg = {
    GO:      { Icon: ShieldCheck, accent: '#00ff66', labelKey: 'status_go'      as const, bg: 'rgba(0,255,102,0.08)',   border: 'rgba(0,255,102,0.25)',   text: '#00ff66' },
    CAUTION: { Icon: ShieldAlert, accent: '#ffb800', labelKey: 'status_caution' as const, bg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.30)',   text: '#ffb800' },
    'NO-GO': { Icon: ShieldX,    accent: '#ff0055', labelKey: 'status_nogo'    as const, bg: 'rgba(255,0,85,0.08)',    border: 'rgba(255,0,85,0.30)',    text: '#ff0055' },
  }[status] ?? { Icon: ShieldAlert, accent: '#ffb800', labelKey: 'status_caution' as const, bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.30)', text: '#ffb800' };

  const { Icon, accent, labelKey, bg, border, text } = cfg;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full text-left rounded-2xl overflow-hidden shrink-0 theme-transition hover:brightness-110 active:scale-[0.995] transition cursor-pointer"
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
                {t('status_analysis')} {profileLabel}
              </p>
              <h2 className="text-lg font-black tracking-tight leading-none font-heading"
                style={{ color: text }}>
                {t(labelKey)}
              </h2>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: text }} />
          </div>

          {/* Divider */}
          <div className="h-px mb-3" style={{ background: border }} />

          {/* AI Message preview (tap for full breakdown) */}
          <p className="text-[12px] leading-relaxed font-data line-clamp-2" style={{ color: 'var(--z-muted)' }}>
            {aiMessage}
          </p>
          <p className="text-[9px] uppercase tracking-widest mt-2 opacity-60" style={{ color: accent }}>
            Tap para ver factores →
          </p>
        </div>
      </button>

      <StatusFactorsModal
        open={open}
        onClose={() => setOpen(false)}
        status={status}
        aiMessage={aiMessage}
        profileLabel={profileLabel}
        data={data}
      />
    </>
  );
}
