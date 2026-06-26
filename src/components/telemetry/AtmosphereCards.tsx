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
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Visibility */}
      <div className="z-card border border-[var(--z-border)] rounded-2xl p-3 flex flex-col justify-between theme-transition">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-[var(--z-muted)]" />
          <span className="text-[10px] font-bold text-[var(--z-muted)] tracking-widest uppercase">Visibilidad</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: visColor }}>{visNum >= 10 ? '10+' : visibility}</span>
          <span className="text-xs text-[var(--z-muted)] font-bold">km</span>
        </div>
        <span className="text-[9px] font-bold text-[var(--z-muted)] uppercase mt-1">{visLabel}</span>
      </div>

      {/* Cloud Base */}
      <div className="z-card border border-[var(--z-border)] rounded-2xl p-3 flex flex-col justify-between theme-transition">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-[var(--z-muted)]" />
          <span className="text-[10px] font-bold text-[var(--z-muted)] tracking-widest uppercase">Techo</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: cloudColor }}>{cloudBase}</span>
          <span className="text-xs text-[var(--z-muted)] font-bold">ft</span>
        </div>
        <span className="text-[9px] font-bold text-[var(--z-muted)] uppercase mt-1">{cloudLabel}</span>
      </div>
    </div>
  );
}
