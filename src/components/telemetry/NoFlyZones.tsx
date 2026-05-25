"use client";
// NoFlyZones — Restricted airspace dashboard for drone operations
// Pulls live airspaces (OpenAIP) via /api/notams and groups them by severity for the pilot.

import { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Ban, Lock, ChevronDown } from 'lucide-react';

interface AirspaceItem {
  properties: {
    notamNumber: string;
    airspaceType: number;
    typeLabel: string;
    distanceNm: number | null;
    notamEvent: {
      text: string;
      effectiveStart: string;
      effectiveEnd: string;
      location: string;
    };
  };
}

// Severity bucket for drones — color, label, priority (lower = more dangerous)
const SEVERITY: Record<number, { tone: string; label: string; priority: number }> = {
  2:  { tone: 'red',    label: 'PROHIBIDO',  priority: 1 }, // Prohibited
  0:  { tone: 'red',    label: 'RESTRINGIDO', priority: 2 }, // Restricted
  1:  { tone: 'orange', label: 'PELIGRO',    priority: 3 }, // Danger
  3:  { tone: 'amber',  label: 'CTR',        priority: 4 }, // Control Zone
  21: { tone: 'amber',  label: 'USO ESPECIAL', priority: 5 }, // Special Use
  4:  { tone: 'yellow', label: 'TMA',        priority: 6 }, // Terminal Maneuvering
};

const TONE_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  red:    { border: 'border-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-300',    dot: 'bg-red-500' },
  orange: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-300', dot: 'bg-orange-500' },
  amber:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  dot: 'bg-amber-500' },
  yellow: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', text: 'text-yellow-300', dot: 'bg-yellow-500' },
};

export default function NoFlyZones({ lat, lon }: { lat: number, lon: number }) {
  const [zones, setZones] = useState<AirspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();

    fetch(`/api/notams?lat=${lat}&lon=${lon}&radius=50`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((data: { items?: AirspaceItem[] }) => {
        const items: AirspaceItem[] = data.items ?? [];
        // Sort by severity priority, then by distance
        items.sort((a, b) => {
          const pa = SEVERITY[a.properties.airspaceType]?.priority ?? 99;
          const pb = SEVERITY[b.properties.airspaceType]?.priority ?? 99;
          if (pa !== pb) return pa - pb;
          return (a.properties.distanceNm ?? 9999) - (b.properties.distanceNm ?? 9999);
        });
        setZones(items);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError('No se pudo cargar el espacio aéreo');
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [lat, lon]);


  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="rounded-3xl p-4 border animate-pulse" style={{ background: 'var(--z-card)', borderColor: 'var(--z-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--z-muted)' }}>
          Escaneando espacio aéreo (OpenAIP)…
        </span>
      </div>
      <div className="h-10 rounded-lg" style={{ background: 'var(--z-surface)' }} />
    </div>
  );

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-3xl p-4 border border-red-500/40 bg-red-500/5">
      <span className="text-[10px] font-bold text-red-400">⚠ {error}</span>
    </div>
  );

  // ─── Clear sky ──────────────────────────────────────────────────────────────
  if (zones.length === 0) return (
    <div className="rounded-3xl p-4 border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Espacio Aéreo Despejado
          </h3>
          <p className="text-[10px]" style={{ color: 'var(--z-muted)' }}>
            Sin restricciones activas en 50 nm para drones
          </p>
        </div>
      </div>
    </div>
  );

  // ─── Group by severity ──────────────────────────────────────────────────────
  const critical = zones.filter(z => SEVERITY[z.properties.airspaceType]?.priority <= 3);
  const caution = zones.filter(z => (SEVERITY[z.properties.airspaceType]?.priority ?? 99) > 3);
  const visible = expanded ? zones : critical.slice(0, 3);

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500">
          Zonas de Exclusión (Dron)
        </h3>
        <span className="ml-auto flex items-center gap-1.5">
          {critical.length > 0 && (
            <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {critical.length} CRÍTICO
            </span>
          )}
          {caution.length > 0 && (
            <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
              {caution.length} PRECAUCIÓN
            </span>
          )}
        </span>
      </div>

      {/* Zone cards */}
      {visible.map((zone, i) => {
        const sev = SEVERITY[zone.properties.airspaceType] ?? { tone: 'amber', label: 'ZONA', priority: 99 };
        const styles = TONE_STYLES[sev.tone];
        const dist = zone.properties.distanceNm;
        return (
          <div
            key={`${zone.properties.notamNumber}-${i}`}
            className={`relative p-4 rounded-3xl border ${styles.border} ${styles.bg} group hover:brightness-110 transition-all cursor-pointer overflow-hidden`}
          >
            {/* Danger stripes for critical zones */}
            {sev.priority <= 2 && (
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ef4444 10px, #ef4444 20px)' }} />
            )}

            <div className="flex items-start gap-3 relative z-10">
              <div className={`w-8 h-8 rounded-xl ${styles.bg} flex items-center justify-center shrink-0 border ${styles.border}`}>
                <Ban className={`w-4 h-4 ${styles.text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${styles.text} truncate`}>
                    {zone.properties.notamNumber}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} />
                    <span className={`text-[8px] font-bold ${styles.text}/80`}>{sev.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono uppercase opacity-60" style={{ color: 'var(--z-text)' }}>
                    {zone.properties.typeLabel}
                  </span>
                  {dist !== null && (
                    <>
                      <span className="text-[8px] opacity-40" style={{ color: 'var(--z-text)' }}>•</span>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--z-text)' }}>
                        {dist} nm
                      </span>
                    </>
                  )}
                </div>

                <p className={`text-[10px] leading-relaxed line-clamp-2 font-mono ${styles.text}/70`}>
                  {zone.properties.notamEvent.text}
                </p>
              </div>

              <Lock className={`w-3 h-3 ${styles.text}/40 mt-1 shrink-0`} />
            </div>
          </div>
        );
      })}

      {/* Show more toggle */}
      {zones.length > visible.length && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest py-2 rounded-2xl border transition-all hover:bg-white/5"
          style={{ borderColor: 'var(--z-border)', color: 'var(--z-muted)' }}
        >
          <ChevronDown className="w-3 h-3" />
          Ver {zones.length - visible.length} zonas más
        </button>
      )}
      {expanded && zones.length > 3 && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[9px] uppercase tracking-widest py-1.5 opacity-50 hover:opacity-100"
          style={{ color: 'var(--z-muted)' }}
        >
          Colapsar
        </button>
      )}
    </div>
  );
}
