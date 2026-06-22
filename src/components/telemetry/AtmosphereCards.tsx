"use client";

import { Eye, CloudFog } from "lucide-react";
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
      {/* Visibility Card */}
      <div className="z-card flex flex-col justify-between p-4 overflow-hidden theme-transition" style={{ minHeight: '130px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <Eye className="w-4 h-4" style={{ color: 'var(--z-muted)' }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--z-muted)' }}>
            VISIBILIDAD
          </span>
        </div>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-[44px] font-semibold tracking-tighter leading-none" style={{ color: visColor }}>
            {visNum >= 10 ? '10+' : visibility}
          </span>
          <span className="text-[22px] font-medium" style={{ color: 'var(--z-muted)' }}>
            km
          </span>
        </div>

        <div className="mt-2">
          <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--z-muted)' }}>
            {visLabel}
          </span>
        </div>
      </div>

      {/* Cloud Base Card */}
      <div className="z-card flex flex-col justify-between p-4 overflow-hidden theme-transition" style={{ minHeight: '130px' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <CloudFog className="w-4 h-4" style={{ color: 'var(--z-muted)' }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--z-muted)' }}>
            TECHO NUBES
          </span>
        </div>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-[44px] font-semibold tracking-tighter leading-none" style={{ color: cloudColor }}>
            {cloudBase}
          </span>
          <span className="text-[22px] font-medium" style={{ color: 'var(--z-muted)' }}>
            ft
          </span>
        </div>

        <div className="mt-2">
          <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--z-muted)' }}>
            {cloudLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
