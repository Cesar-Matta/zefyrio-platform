"use client";
// SigmetAlert — SIGMET/AIRMET hazard display component
// Fetches and renders active SIGMETs/AIRMETs near the pilot's location

import { useState, useEffect } from "react";
import { AlertTriangle, CloudLightning, Snowflake, Wind, Eye, Mountain, type LucideIcon } from "lucide-react";
import AlertDetailModal from "@/components/ui/AlertDetailModal";

interface SigmetItem {
  airSigmetId: number;
  icaoId: string;
  airSigmetType: string;
  hazard: string;
  severity: string;
  altitudeLo: number;
  altitudeHi: number;
  rawAirSigmet: string;
  validTimeFrom: string;
  validTimeTo: string;
}

interface SigmetAlertProps {
  lat: number;
  lon: number;
}

const HAZARD_CONFIG: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  TURB:       { icon: Wind,           label: 'Turbulencia',        color: '#ffb800' },
  ICE:        { icon: Snowflake,      label: 'Engelamiento',       color: '#00b4d8' },
  IFR:        { icon: Eye,            label: 'Baja Visibilidad',   color: '#ff6b6b' },
  'MTN OBSCN':{ icon: Mountain,       label: 'Montaña Obscurecida',color: '#a78bfa' },
  TS:         { icon: CloudLightning, label: 'Tormenta Eléctrica', color: '#ff0055' },
  CONVECTIVE: { icon: CloudLightning, label: 'Convección Severa',  color: '#ff0055' },
};

export default function SigmetAlert({ lat, lon }: SigmetAlertProps) {
  const [sigmets, setSigmets] = useState<SigmetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SigmetItem | null>(null);

  const fmtDate = (iso?: string) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  };

  useEffect(() => {
    if (lat == null || lon == null) return;

    const fetchSigmets = async () => {
      try {
        const res = await fetch(`/api/sigmet?lat=${lat}&lon=${lon}`);
        const data = await res.json() as { items?: SigmetItem[] };
        if (data.items) setSigmets(data.items);
      } catch (error) {
        console.error("SIGMET fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSigmets();
    // Refresh every 10 minutes
    const interval = setInterval(fetchSigmets, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading) return null;
  if (sigmets.length === 0) return null;

  const critical = sigmets.filter(s => s.severity === 'SEV' || s.hazard === 'TS' || s.hazard === 'CONVECTIVE');
  const hasCritical = critical.length > 0;

  const borderColor = hasCritical ? '#ff0055' : '#ffb800';
  const bgColor = hasCritical ? 'rgba(255,0,85,0.06)' : 'rgba(255,184,0,0.06)';

  return (
    <>
      <section
        className="rounded-2xl overflow-hidden shrink-0 theme-transition"
        style={{ background: bgColor, border: `1px solid ${borderColor}30` }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${borderColor}18`, border: `1px solid ${borderColor}40` }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: borderColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--z-muted)' }}>
                SIGMET / AIRMET
              </p>
              <p className="text-[13px] font-black font-heading" style={{ color: borderColor }}>
                {sigmets.length} {sigmets.length === 1 ? 'ALERTA ACTIVA' : 'ALERTAS ACTIVAS'}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: borderColor }} />
          </div>

          {/* Chips — each one opens detail modal */}
          <div className="flex flex-wrap gap-1.5">
            {sigmets.map((sigmet, idx) => {
              const cfg = HAZARD_CONFIG[sigmet.hazard] || { icon: AlertTriangle, label: sigmet.hazard, color: '#ffb800' };
              const Icon = cfg.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setSelected(sigmet)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider hover:brightness-125 transition"
                  style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                  {sigmet.severity && <span className="opacity-60">({sigmet.severity})</span>}
                </button>
              );
            })}
          </div>

          <p className="text-[8px] text-center mt-2 font-data" style={{ color: 'var(--z-muted)', opacity: 0.5 }}>
            TAP UNA ALERTA PARA VER DETALLE
          </p>
        </div>
      </section>

      {selected && (() => {
        const cfg = HAZARD_CONFIG[selected.hazard] || { icon: AlertTriangle, label: selected.hazard, color: '#ffb800' };
        return (
          <AlertDetailModal
            open={true}
            onClose={() => setSelected(null)}
            icon={cfg.icon}
            accent={cfg.color}
            badge={selected.airSigmetType}
            title={`${cfg.label}${selected.severity ? ` · ${selected.severity}` : ''}`}
            subtitle={selected.icaoId}
            body={selected.rawAirSigmet || 'Sin descripción disponible.'}
            fields={[
              { label: 'ICAO', value: selected.icaoId, mono: true },
              { label: 'Tipo', value: selected.airSigmetType, mono: true },
              { label: 'Altitud inferior', value: selected.altitudeLo ? `FL${Math.round(selected.altitudeLo / 100)}` : null, mono: true },
              { label: 'Altitud superior', value: selected.altitudeHi ? `FL${Math.round(selected.altitudeHi / 100)}` : null, mono: true },
              { label: 'Vigente desde', value: fmtDate(selected.validTimeFrom), mono: true },
              { label: 'Vigente hasta', value: fmtDate(selected.validTimeTo), mono: true },
            ]}
            raw={selected.rawAirSigmet}
          />
        );
      })()}
    </>
  );
}
