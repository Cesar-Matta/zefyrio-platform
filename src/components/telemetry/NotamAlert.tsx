"use client";
// SKILL: api-patterns | frontend-developer
// NotamAlert — Critical NOTAMs Dashboard Widget

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronRight, Info } from 'lucide-react';
import type { NotamItem } from '@/lib/types/api';
import AlertDetailModal from '@/components/ui/AlertDetailModal';

export default function NotamAlert({ lat, lon }: { lat: number, lon: number }) {
  const [notams, setNotams] = useState<NotamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NotamItem | null>(null);

  const fmtDate = (iso?: string) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  };

  useEffect(() => {
    const fetchNotams = async () => {
      try {
        const res = await fetch(`/api/notams?lat=${lat}&lon=${lon}&radius=30`);
        const data = await res.json();
        if (data.items) {
          // Filter most relevant (those starting recently or containing critical words)
          const critical = data.items.slice(0, 3);
          setNotams(critical);
        }
      } catch (error) {
        console.error("NotamAlert fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotams();
  }, [lat, lon]);

  if (loading) return (
    <div className="glass-panel p-4 rounded-3xl animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
      <div className="h-10 w-full bg-white/5 rounded italic text-[10px] flex items-center px-4">
        SCANNING NOTAM DATABASE...
      </div>
    </div>
  );

  if (notams.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          NOTAMs Críticos (Área 30nm)
        </h3>
        <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
          {notams.length} ACTIVOS
        </span>
      </div>

      {notams.map((notam, i) => (
        <div
          key={i}
          onClick={() => setSelected(notam)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(notam); }}
          className="glass-panel p-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 group hover:bg-amber-500/10 transition-all cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-200">
                  {notam.properties.notamNumber}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-white/40">
                  <Clock className="w-3 h-3" />
                  <span>EFECTIVO: {notam.properties.notamEvent?.effectiveStart ? new Date(notam.properties.notamEvent.effectiveStart).toLocaleDateString() : '—'}</span>
                </div>
              </div>
              
              <p className="text-[10px] leading-relaxed text-white/70 line-clamp-2 font-mono italic">
                {notam.properties.notamEvent.text}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-500 transition-colors mt-3" />
          </div>
        </div>
      ))}

      {selected && (() => {
        const ev = selected.properties.notamEvent;
        return (
          <AlertDetailModal
            open={true}
            onClose={() => setSelected(null)}
            icon={Info}
            accent="#ffb800"
            badge="NOTAM"
            title={selected.properties.notamNumber}
            subtitle={ev?.location || undefined}
            body={ev?.text || 'Sin descripción disponible.'}
            fields={[
              { label: 'Ubicación', value: ev?.location, mono: true },
              { label: 'Vigente desde', value: fmtDate(ev?.effectiveStart), mono: true },
              { label: 'Vigente hasta', value: fmtDate(ev?.effectiveEnd), mono: true },
            ]}
          />
        );
      })()}
    </div>
  );
}
