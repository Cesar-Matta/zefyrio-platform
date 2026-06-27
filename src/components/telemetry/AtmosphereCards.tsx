"use client";

import { Eye, Cloud } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AtmosphereCardsProps {
  visibility: string;
  cloudBase: number;
}

export default function AtmosphereCards({ visibility, cloudBase }: AtmosphereCardsProps) {
  const { t } = useTranslation();
  
  const visNum = parseFloat(visibility) || 0;
  const visColor = visNum >= 10 ? 'var(--color-system-green)' : visNum >= 5 ? '#facc15' : 'var(--color-system-red)';
  const visLabel = visNum >= 10 ? 'ÓPTIMA' : visNum >= 5 ? 'BUENA' : visNum >= 2 ? 'REDUCIDA' : 'MALA';

  const cloudColor = cloudBase >= 1500 ? 'var(--color-system-green)' : cloudBase >= 500 ? '#facc15' : 'var(--color-system-red)';
  const cloudLabel = cloudBase >= 1500 ? 'ALTA' : cloudBase >= 500 ? 'MEDIA' : 'BAJA';

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {/* Visibility */}
      <div className="z-card border border-[var(--z-border)] rounded-xl px-3 py-2 flex items-center justify-between theme-transition shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Eye className="w-3 h-3 text-[var(--z-muted)]" />
            <span className="text-[9px] font-medium text-[var(--z-muted)] tracking-widest uppercase">Visibilidad</span>
          </div>
          <span className="text-[8px] font-medium text-[var(--z-muted)] tracking-wider uppercase opacity-80">{visLabel}</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-light tracking-tight" style={{ color: visColor }}>{visNum >= 10 ? '10+' : visibility}</span>
          <span className="text-[9px] text-[var(--z-muted)] font-medium">km</span>
        </div>
      </div>

      {/* Cloud Base */}
      <div className="z-card border border-[var(--z-border)] rounded-xl px-3 py-2 flex items-center justify-between theme-transition shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Cloud className="w-3 h-3 text-[var(--z-muted)]" />
            <span className="text-[9px] font-medium text-[var(--z-muted)] tracking-widest uppercase">Techo</span>
          </div>
          <span className="text-[8px] font-medium text-[var(--z-muted)] tracking-wider uppercase opacity-80">{cloudLabel}</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-light tracking-tight" style={{ color: cloudColor }}>{cloudBase}</span>
          <span className="text-[9px] text-[var(--z-muted)] font-medium">ft</span>
        </div>
      </div>
    </div>
  );
}
