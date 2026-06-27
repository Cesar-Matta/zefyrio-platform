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
    GO:      { Icon: ShieldCheck, accent: 'var(--color-system-green)', labelKey: 'status_go'      as const, bg: 'rgba(0,255,102,0.08)',   border: 'rgba(0,255,102,0.25)',   text: 'var(--color-system-green)' },
    CAUTION: { Icon: ShieldAlert, accent: 'var(--color-system-orange)', labelKey: 'status_caution' as const, bg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.30)',   text: 'var(--color-system-orange)' },
    'NO-GO': { Icon: ShieldX,    accent: 'var(--color-system-red)', labelKey: 'status_nogo'    as const, bg: 'rgba(255,0,85,0.08)',    border: 'rgba(255,0,85,0.30)',    text: 'var(--color-system-red)' },
  }[status] ?? { Icon: ShieldAlert, accent: 'var(--color-system-orange)', labelKey: 'status_caution' as const, bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.30)', text: 'var(--color-system-orange)' };

  const { Icon, accent, labelKey, bg, border, text } = cfg;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full text-left rounded-xl border border-[var(--z-border)] shadow-sm overflow-hidden shrink-0 theme-transition active:scale-[0.98] transition cursor-pointer z-card px-3 py-2.5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-wide uppercase mb-0.5" style={{ color: 'var(--z-muted)' }}>
                CONDICIONES DE VUELO
              </p>
              <h2 className="text-lg font-semibold tracking-tight leading-none" style={{ color: text }}>
                {t(labelKey)}
              </h2>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--z-muted)' }} />
        </div>

        <p className="text-xs leading-snug line-clamp-2 mb-2" style={{ color: 'var(--z-text)' }}>
          {aiMessage}
        </p>
        <div className="flex">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full" style={{ background: text, color: '#ffffff' }}>
            Más Información <ChevronRight className="w-3 h-3" />
          </span>
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
