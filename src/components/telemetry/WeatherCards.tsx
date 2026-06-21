"use client";
// WeatherCards — Redesign Premium v4.0
// i18n-ready

import { Thermometer, Droplets } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface WeatherCardsProps {
  temperature: number;
  feelsLike: number;
  rainChance: number;
  clouds: number;
  className?: string;
}

export default function WeatherCards({ temperature, feelsLike, rainChance, clouds, className = "" }: WeatherCardsProps) {
  const { t } = useTranslation();
  const tempColor = temperature > 35 ? '#ff5733' : temperature < 5 ? '#60a5fa' : 'var(--z-text)';
  const rainColor = rainChance > 70 ? '#3b82f6' : rainChance > 40 ? '#60a5fa' : 'var(--color-system-green)';

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Temperature Card */}
      <div
        className={`z-card flex flex-col justify-between p-4 overflow-hidden theme-transition ${className}`}
        style={{ minHeight: '130px' }}
      >
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4" style={{ color: 'var(--color-system-orange)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--z-muted)' }}>
            {t('weather_temp')}
          </span>
        </div>

        <div className="flex items-baseline gap-0.5 mt-2">
          <span className="text-[40px] font-semibold tracking-tighter leading-none" style={{ color: 'var(--z-text)' }}>
            {temperature.toFixed(1)}
          </span>
          <span className="text-[18px] font-medium" style={{ color: 'var(--z-text)' }}>
            °C
          </span>
        </div>

        <span className="text-[12px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--z-muted)' }}>
          SENS: {feelsLike}°
        </span>
      </div>

      {/* Rain / Clouds Card */}
      <div
        className={`z-card flex flex-col justify-between p-4 overflow-hidden theme-transition ${className}`}
        style={{ minHeight: '130px' }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Droplets className="w-3.5 h-3.5" style={{ color: 'var(--z-muted)' }} />
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--z-muted)' }}>
            LLUVIA
          </span>
        </div>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-[44px] font-semibold tracking-tighter leading-none" style={{ color: rainColor }}>
            {rainChance}
          </span>
          <span className="text-[22px] font-medium" style={{ color: 'var(--z-muted)' }}>
            %
          </span>
        </div>

        {/* Cloud bar */}
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium" style={{ color: 'var(--z-muted)' }}>{t('weather_clouds')}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--z-muted)' }}>{clouds}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--z-surface)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${clouds}%`, background: 'var(--color-system-blue)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
