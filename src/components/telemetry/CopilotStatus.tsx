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
        className="relative w-full text-left rounded-[20px] overflow-hidden shrink-0 theme-transition active:scale-[0.98] transition cursor-pointer z-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wide uppercase mb-0.5" style={{ color: 'var(--z-muted)' }}>
                CONDICIONES DE VUELO
              </p>
              <h2 className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: text }}>
                {t(labelKey)}
              </h2>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>

        <p className="text-[14px] leading-relaxed line-clamp-2 mb-1" style={{ color: 'var(--z-muted)' }}>
          {aiMessage}
        </p>
        <div className="mt-4 flex">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase px-4 py-1.5 rounded-full" style={{ background: text, color: '#ffffff' }}>
            Más Información <ChevronRight className="w-3.5 h-3.5" />
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
