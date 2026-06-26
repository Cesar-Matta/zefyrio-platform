import React from 'react';
import { KpForecastHour } from '@/store/useStore';

interface KpForecastSliderProps {
  kpForecast: KpForecastHour[];
}

export default function KpForecastSlider({ kpForecast }: KpForecastSliderProps) {
  if (!kpForecast || kpForecast.length === 0) {
    return null; // Do not render if there's no data
  }

  return (
    <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h2 className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Pronóstico Kp (3 días)</h2>
      </div>
      
      <div className="flex overflow-x-auto gap-2 pb-2 snap-x hide-scrollbar">
        {kpForecast.map((hour, index) => {
          const kp = hour.kp;
          
          let bgColor = 'bg-green-500/10 border-green-500/20';
          let textColor = 'text-green-500';
          if (kp >= 4) {
            bgColor = 'bg-red-500/10 border-red-500/20';
            textColor = 'text-red-500';
          } else if (kp >= 3) {
            bgColor = 'bg-yellow-500/10 border-yellow-500/20';
            textColor = 'text-yellow-500';
          }

          const dateObj = new Date(hour.time);
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isToday = dateObj.getDate() === new Date().getDate();
          const dayStr = isToday ? 'Hoy' : dateObj.toLocaleDateString([], { weekday: 'short' });

          return (
            <div 
              key={index} 
              className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border ${bgColor} snap-center min-w-[70px]`}
            >
              <span className="text-[9px] font-bold text-white/40 uppercase">{dayStr}</span>
              <span className="text-xs font-bold text-white/80 mb-1">{timeStr}</span>
              <span className={`text-xl font-black ${textColor}`}>{kp.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
