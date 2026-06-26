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
      <div className="bg-[#111] border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">
            {t('weather_temp')}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: 'var(--z-text)' }}>
            {temperature.toFixed(1)}
          </span>
          <span className="text-xs text-white/40 font-bold">°C</span>
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase mt-1">
          SENS: {feelsLike}°
        </span>
      </div>

      {/* Rain Card */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">
            Lluvia
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: rainColor }}>
            {rainChance}
          </span>
          <span className="text-xs text-white/40 font-bold">%</span>
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase mt-1">
          Nubes: {clouds}%
        </span>
      </div>
    </div>
  );
}
