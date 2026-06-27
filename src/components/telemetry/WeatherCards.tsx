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
    <div className="grid grid-cols-2 gap-2 w-full">
      {/* Temperature Card */}
      <div className="z-card border border-[var(--z-border)] rounded-xl px-3 py-2 flex items-center justify-between theme-transition shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Thermometer className="w-3 h-3" style={{ color: 'var(--color-system-orange)' }} />
            <span className="text-[9px] font-medium text-[var(--z-muted)] tracking-widest uppercase">
              {t('weather_temp')}
            </span>
          </div>
          <span className="text-[8px] font-medium text-[var(--z-muted)] tracking-wider uppercase opacity-80">
            SENS: {feelsLike}°
          </span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-light tracking-tight" style={{ color: 'var(--z-text)' }}>
            {temperature.toFixed(1)}
          </span>
          <span className="text-[9px] text-[var(--z-muted)] font-medium">°C</span>
        </div>
      </div>

      {/* Rain Card */}
      <div className="z-card border border-[var(--z-border)] rounded-xl px-3 py-2 flex items-center justify-between theme-transition shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Droplets className="w-3 h-3" style={{ color: 'var(--color-system-blue)' }} />
            <span className="text-[9px] font-medium text-[var(--z-muted)] tracking-widest uppercase">
              Lluvia
            </span>
          </div>
          <span className="text-[8px] font-medium text-[var(--z-muted)] tracking-wider uppercase opacity-80">
            Nubes: {clouds}%
          </span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-light tracking-tight" style={{ color: rainColor }}>
            {rainChance}
          </span>
          <span className="text-[9px] text-[var(--z-muted)] font-medium">%</span>
        </div>
      </div>
    </div>
  );
}
