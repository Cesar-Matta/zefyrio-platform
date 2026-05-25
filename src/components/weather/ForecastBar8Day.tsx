"use client";
import { useState, useEffect, useCallback } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, RefreshCw } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/api/fetchWithTimeout';

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
  const [isLoading, setIsLoading] = useState(false);

  const fetchForecast = useCallback(async () => {
    if (!lat || !lon) return;
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime(); // Cache busting
      const res = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&_t=${timestamp}`, { cache: 'no-store' }, 6000);
      const data = await res.json();
      
      if (data && data.daily) {
        const days = data.daily.time.map((t: string, i: number) => ({
          date: t,
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          code: data.daily.weathercode[i]
        }));
        setForecast(days);
      }
    } catch (err) {
      console.error("Forecast fetch error", err);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  if (!forecast.length && !isLoading) return null;

  return (
    <div className="w-full flex flex-col gap-2 relative">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Próximos Días</span>
        <button 
          onClick={fetchForecast} 
          disabled={isLoading}
          className="p-1 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Actualizar pronóstico"
        >
          <RefreshCw className={`w-3 h-3 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {forecast.map((day, i) => {
            const date = new Date(day.date + 'T12:00:00Z'); // force midday to avoid timezone shifts
            const isToday = i === 0;
            return (
              <div key={day.date} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isToday ? 'bg-white/5 border border-cyber-cyan/30' : ''}`}>
                <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">
                  {isToday ? 'Hoy' : date.toLocaleDateString('es-ES', { weekday: 'short' })}
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
    </div>
  );
}
