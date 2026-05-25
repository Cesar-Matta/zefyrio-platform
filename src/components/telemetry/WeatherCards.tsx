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
  const rainColor = rainChance > 70 ? '#3b82f6' : rainChance > 40 ? '#60a5fa' : '#00ff66';

  return (
    <>
      {/* Temperature Card */}
      <div
        className={`rounded-2xl flex flex-col justify-between p-4 overflow-hidden theme-transition ${className}`}
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)', minHeight: '130px' }}
      >
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3 h-3" style={{ color: '#f97316' }} />
          <span className="text-[9px] uppercase tracking-[0.16em] font-semibold"
            style={{ color: 'var(--z-muted)' }}>
            {t('weather_temp')}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-[38px] font-black leading-none font-data"
            style={{ color: tempColor }}>
            {temperature}
          </span>
          <span className="text-[20px] font-semibold" style={{ color: 'var(--z-muted)' }}>°C</span>
        </div>

        <span className="text-[10px] font-data mt-1" style={{ color: 'var(--z-muted)' }}>
          {t('weather_feels')}: {feelsLike}°
        </span>
      </div>

      {/* Rain / Clouds Card */}
      <div
        className={`rounded-2xl flex flex-col justify-between p-4 overflow-hidden theme-transition ${className}`}
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)', minHeight: '130px' }}
      >
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3 h-3" style={{ color: '#60a5fa' }} />
          <span className="text-[9px] uppercase tracking-[0.16em] font-semibold"
            style={{ color: 'var(--z-muted)' }}>
            {t('weather_rain')}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-[38px] font-black leading-none font-data"
            style={{ color: rainColor }}>
            {rainChance}
          </span>
          <span className="text-[20px] font-semibold" style={{ color: 'var(--z-muted)' }}>%</span>
        </div>

        {/* Cloud bar */}
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>{t('weather_clouds')}</span>
            <span className="text-[8px] font-data font-bold" style={{ color: 'var(--z-muted)' }}>{clouds}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--z-surface)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${clouds}%`, background: 'linear-gradient(90deg, #60a5fa88, #60a5fa)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
