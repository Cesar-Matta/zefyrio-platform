"use client";
// SigmetAlert — SIGMET/AIRMET hazard display component
// Fetches and renders active SIGMETs/AIRMETs near the pilot's location

import { useState, useEffect } from "react";
import { AlertTriangle, CloudLightning, Snowflake, Wind, Eye, Mountain, type LucideIcon } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);

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
    <section
      className="rounded-2xl overflow-hidden shrink-0 theme-transition cursor-pointer"
      style={{ background: bgColor, border: `1px solid ${borderColor}30` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${borderColor}18`, border: `1px solid ${borderColor}40` }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: borderColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.16em] font-semibold"
              style={{ color: 'var(--z-muted)' }}>
              SIGMET / AIRMET
            </p>
            <p className="text-[13px] font-black font-heading" style={{ color: borderColor }}>
              {sigmets.length} {sigmets.length === 1 ? 'ALERTA ACTIVA' : 'ALERTAS ACTIVAS'}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: borderColor }}
          />
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {sigmets.slice(0, 4).map((sigmet, idx) => {
            const cfg = HAZARD_CONFIG[sigmet.hazard] || { icon: AlertTriangle, label: sigmet.hazard, color: '#ffb800' };
            const Icon = cfg.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
                {sigmet.severity && <span className="opacity-60">({sigmet.severity})</span>}
              </div>
            );
          })}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="h-px" style={{ background: `${borderColor}20` }} />
            {sigmets.map((sigmet, idx) => {
              const cfg = HAZARD_CONFIG[sigmet.hazard] || { icon: AlertTriangle, label: sigmet.hazard, color: '#ffb800' };
              return (
                <div key={idx} className="rounded-xl p-3" style={{ background: 'var(--z-surface)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold font-data" style={{ color: cfg.color }}>
                      {sigmet.airSigmetType} — {cfg.label}
                    </span>
                    <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>
                      FL{Math.round(sigmet.altitudeLo / 100)}–FL{Math.round(sigmet.altitudeHi / 100)}
                    </span>
                  </div>
                  <p className="text-[10px] font-data leading-relaxed break-words" style={{ color: 'var(--z-muted)' }}>
                    {sigmet.rawAirSigmet.length > 200
                      ? sigmet.rawAirSigmet.substring(0, 200) + '...'
                      : sigmet.rawAirSigmet}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tap hint */}
        {!expanded && sigmets.length > 0 && (
          <p className="text-[8px] text-center mt-1 font-data" style={{ color: 'var(--z-muted)', opacity: 0.5 }}>
            TAP PARA DETALLES
          </p>
        )}
      </div>
    </section>
  );
}
