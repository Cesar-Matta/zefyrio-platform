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
    <div className="z-card w-full border border-[var(--z-border)] rounded-2xl p-5 flex flex-col gap-4 shadow-sm theme-transition">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--z-border)] pb-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--z-muted)]" />
          <h2 className="text-xs font-bold text-[var(--z-text)] tracking-widest uppercase">Pronóstico Kp</h2>
        </div>
        <span className="text-[10px] font-bold text-[var(--z-muted)] uppercase bg-[var(--z-surface)] px-2 py-1 rounded-md">
          {dayStr} {timeStr}
        </span>
      </div>
      
      {/* Central Data Display */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black ${textColor} tabular-nums tracking-tighter`}>
            {kp.toFixed(1)}
          </span>
        </div>
        <span className={`text-xs font-black uppercase tracking-widest mt-1 ${textColor}`}>
          {statusText}
        </span>
      </div>

      {/* Scrubber / Slider */}
      <div className="flex flex-col gap-2 mt-2">
        <input 
          type="range" 
          min="0" 
          max={kpForecast.length - 1} 
          step="1" 
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
          className="w-full accent-[var(--color-system-blue)] h-2 bg-[var(--z-border)] rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between items-center text-[9px] font-bold text-[var(--z-muted)] uppercase px-1">
          <span>Ahora</span>
          <span>+24h</span>
        </div>
      </div>
    </div>
  );
}
