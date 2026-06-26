"use client";

import { useState } from "react";
import { KpForecastHour } from "@/store/useStore";
import { Activity } from "lucide-react";

interface KpTimelineScrubberProps {
  kpForecast: KpForecastHour[];
}

export default function KpTimelineScrubber({ kpForecast }: KpTimelineScrubberProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!kpForecast || kpForecast.length === 0) return null;

  const currentData = kpForecast[selectedIndex];
  const kp = currentData.kp;

  // Determine colors based on severity
  let textColor = 'text-green-500';
  let bgColor = 'bg-green-500';
  let statusText = 'Normal';
  
  if (kp >= 5) {
    textColor = 'text-red-500';
    bgColor = 'bg-red-500';
    statusText = 'Tormenta';
  } else if (kp >= 4) {
    textColor = 'text-yellow-500';
    bgColor = 'bg-yellow-500';
    statusText = 'Activo';
  }

  // Format time
  const date = new Date(currentData.time);
  const isToday = date.getDate() === new Date().getDate();
  const dayStr = isToday ? "Hoy" : date.toLocaleDateString('es-ES', { weekday: 'short' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="z-card w-full border border-[var(--z-border)] rounded-xl p-3 flex flex-col gap-2 shadow-sm theme-transition">
      
      {/* Top Row: Label, Scrubber, Value */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 shrink-0">
          <Activity size={12} className="text-[var(--z-muted)]" />
          <h2 className="text-[10px] font-bold text-[var(--z-text)] tracking-widest uppercase">KP</h2>
        </div>

        <input 
          type="range" 
          min="0" 
          max={kpForecast.length - 1} 
          step="1" 
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
          className="flex-1 accent-[var(--color-system-blue)] h-1.5 bg-[var(--z-border)] rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex flex-col items-end shrink-0 min-w-[35px]">
          <span className={`text-lg font-black leading-none tabular-nums ${textColor}`}>
            {kp.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Bottom Row: Time and Status */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-bold text-[var(--z-muted)] uppercase">
          {dayStr} {timeStr}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${textColor}`}>
          {statusText}
        </span>
      </div>

    </div>
  );
}
