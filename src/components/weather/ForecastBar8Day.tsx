"use client";
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind } from 'lucide-react';

interface DayForecast {
  date: string;
  max: number;
  min: number;
  code: number;
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="w-5 h-5 text-amber-400" />;
  if (code < 3) return <Cloud className="w-5 h-5 text-blue-300" />;
  if (code < 60) return <CloudRain className="w-5 h-5 text-cyan-400" />;
  if (code < 90) return <CloudLightning className="w-5 h-5 text-purple-400" />;
  return <Wind className="w-5 h-5 text-slate-400" />;
};

export default function ForecastBar8Day({ lat, lon }: { lat: number, lon: number }) {
  const [forecast, setForecast] = useState<DayForecast[]>([]);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        
        const days = data.daily.time.map((t: string, i: number) => ({
          date: t,
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          code: data.daily.weathercode[i]
        }));
        setForecast(days);
      } catch (err) {
        console.error("Forecast fetch error", err);
      }
    };
    fetchForecast();
  }, [lat, lon]);

  if (!forecast.length) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-[800px] overflow-x-auto no-scrollbar">
      <div className="flex gap-2 p-3 bg-[#0b0d17]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-w-max">
        {forecast.map((day, i) => {
          const date = new Date(day.date);
          const isToday = i === 0;
          return (
            <div key={day.date} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isToday ? 'bg-white/5 border border-cyber-cyan/30' : ''}`}>
              <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">
                {isToday ? 'Today' : date.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <div className="p-1">
                {getWeatherIcon(day.code)}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold">{Math.round(day.max)}°</span>
                <span className="text-[9px] opacity-30 font-mono">{Math.round(day.min)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
