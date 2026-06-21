"use client";
// ForecastCards — Hourly outlook (wind / UV / humidity / visibility) for drones.
// Single component, four metric modes. Each card pulls from /api/forecast and
// renders a sparkline + drone-tuned colour coding.

import { useEffect, useMemo, useState } from "react";
import { Wind, Sun, Droplets, Eye, type LucideIcon } from "lucide-react";
import type { ForecastResponse, HourlyForecast } from "@/app/api/forecast/route";

export type ForecastMetric = "wind" | "uv" | "humidity" | "visibility";

interface MetricConfig {
  label: string;
  unit: string;
  Icon: LucideIcon;
  accent: string;
  // Pull metric value out of an hourly sample.
  pick: (h: HourlyForecast) => number;
  // Map a value to a drone-safety tier ("ok" | "warn" | "crit").
  tier: (v: number) => "ok" | "warn" | "crit";
  // Free-form copy describing the current value for drones.
  tip: (v: number) => string;
  // Optional formatter for the big current value (e.g. 1 decimal vs integer).
  format?: (v: number) => string;
}

const TIER_COLOR: Record<"ok" | "warn" | "crit", string> = {
  ok:   "var(--color-system-green)",
  warn: "var(--color-system-orange)",
  crit: "var(--color-system-red)",
};

const METRIC: Record<ForecastMetric, MetricConfig> = {
  wind: {
    label: "Viento por horas",
    unit: "km/h",
    Icon: Wind,
    accent: "var(--color-system-blue)",
    pick: (h) => h.windSpeed,
    tier: (v) => (v >= 25 ? "crit" : v >= 15 ? "warn" : "ok"),
    tip: (v) =>
      v >= 25
        ? "Vientos críticos — no despegar"
        : v >= 15
        ? "Viento marginal — pilotos expertos"
        : "Viento nominal para drones",
    format: (v) => v.toFixed(0),
  },
  uv: {
    label: "Índice UV",
    unit: "",
    Icon: Sun,
    accent: "#f97316",
    pick: (h) => h.uvIndex,
    tier: (v) => (v >= 8 ? "crit" : v >= 6 ? "warn" : "ok"),
    tip: (v) =>
      v >= 11
        ? "Extremo — proteger sensores y piel"
        : v >= 8
        ? "Muy alto — usar polarizadores"
        : v >= 6
        ? "Alto — exposición moderada"
        : v >= 3
        ? "Moderado"
        : "Bajo",
    format: (v) => v.toFixed(1),
  },
  humidity: {
    label: "Humedad",
    unit: "%",
    Icon: Droplets,
    accent: "#22d3ee",
    pick: (h) => h.humidity,
    tier: (v) => (v >= 95 ? "crit" : v >= 85 ? "warn" : "ok"),
    tip: (v) =>
      v >= 95
        ? "Riesgo de niebla y condensación en lentes"
        : v >= 85
        ? "Humedad alta — vigilar condensación"
        : "Humedad confortable",
    format: (v) => v.toFixed(0),
  },
  visibility: {
    label: "Visibilidad",
    unit: "km",
    Icon: Eye,
    accent: "#a78bfa",
    // Open-Meteo gives metres → convert to km
    pick: (h) => h.visibility / 1000,
    tier: (v) => (v < 3 ? "crit" : v < 5 ? "warn" : "ok"),
    tip: (v) =>
      v < 1
        ? "VLOS imposible — no operar"
        : v < 3
        ? "VLOS comprometido — mantener bajo y cerca"
        : v < 5
        ? "Visibilidad reducida — vigilar referencias"
        : "Visibilidad óptima",
    format: (v) => v.toFixed(1),
  },
};

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({
  values,
  accent,
  tiers,
  height = 36,
}: {
  values: number[];
  accent: string;
  tiers: Array<"ok" | "warn" | "crit">;
  height?: number;
}) {
  if (values.length < 2) return null;
  const W = 240;
  const H = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return { x, y, tier: tiers[i] };
  });

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${H} ${polyPoints} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`sparkline-grad-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkline-grad-${accent.replace("#", "")})`} />
      <polyline
        points={polyPoints}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => {
        // Only highlight critical/warn dots to keep noise low.
        if (p.tier === "ok") return null;
        return <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={TIER_COLOR[p.tier]} />;
      })}
    </svg>
  );
}

// ─── Single Card ─────────────────────────────────────────────────────────────
function ForecastCard({
  metric,
  hourly,
  loading,
}: {
  metric: ForecastMetric;
  hourly: HourlyForecast[];
  loading: boolean;
}) {
  const cfg = METRIC[metric];
  const { Icon } = cfg;

  const { values, tiers, current, currentTier, peak, peakHour } = useMemo(() => {
    if (!hourly.length) {
      return { values: [] as number[], tiers: [] as Array<"ok" | "warn" | "crit">, current: 0, currentTier: "ok" as const, peak: 0, peakHour: "" };
    }
    const vals = hourly.map(cfg.pick);
    const ts = vals.map(cfg.tier);
    const peakIdx = vals.reduce((acc, v, i) => (v > vals[acc] ? i : acc), 0);
    return {
      values: vals,
      tiers: ts,
      current: vals[0] ?? 0,
      currentTier: ts[0] ?? "ok",
      peak: vals[peakIdx] ?? 0,
      peakHour: hourly[peakIdx]?.hour ?? "",
    };
  }, [hourly, cfg]);

  const fmt = cfg.format ?? ((v: number) => v.toFixed(1));

  if (loading) {
    return (
      <div className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-3 h-3" style={{ color: cfg.accent }} />
          <span className="text-[9px] font-bold tracking-tight" style={{ color: "var(--z-muted)" }}>
            {cfg.label}
          </span>
        </div>
        <div className="h-12 rounded-lg" style={{ background: "var(--z-surface)" }} />
      </div>
    );
  }

  if (!hourly.length) {
    return (
      <div className="rounded-2xl p-4 border" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3 h-3" style={{ color: cfg.accent }} />
          <span className="text-[9px] font-bold tracking-tight" style={{ color: "var(--z-muted)" }}>
            {cfg.label}
          </span>
        </div>
        <p className="text-[10px]" style={{ color: "var(--z-muted)" }}>Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 border flex flex-col gap-3 relative overflow-hidden" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: cfg.accent, filter: `drop-shadow(0 0 4px ${cfg.accent}80)` }} />
        <span className="text-[9px] font-bold tracking-tight" style={{ color: "var(--z-muted)" }}>
          {cfg.label}
        </span>
        <span
          className="ml-auto text-[8px] font-bold tracking-tight px-1.5 py-0.5 rounded-full"
          style={{ background: `${TIER_COLOR[currentTier]}1a`, color: TIER_COLOR[currentTier], border: `1px solid ${TIER_COLOR[currentTier]}40` }}
        >
          {currentTier === "ok" ? "OK" : currentTier === "warn" ? "WARN" : "CRIT"}
        </span>
      </div>

      {/* Current value */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black font-data leading-none" style={{ color: TIER_COLOR[currentTier] }}>
          {fmt(current)}
        </span>
        {cfg.unit && (
          <span className="text-[10px] font-bold" style={{ color: "var(--z-muted)" }}>{cfg.unit}</span>
        )}
      </div>

      {/* Sparkline */}
      <div className="flex-1">
        <Sparkline values={values} accent={cfg.accent} tiers={tiers} />
      </div>

      {/* Footer — peak + tip */}
      <div className="flex items-center justify-between text-[8px] tracking-tight" style={{ color: "var(--z-muted)" }}>
        <span>Pico {fmt(peak)} {cfg.unit} · {peakHour}</span>
        <span className="font-bold" style={{ color: TIER_COLOR[currentTier] }}>
          {cfg.tip(current)}
        </span>
      </div>
    </div>
  );
}

// ─── Grid wrapper ────────────────────────────────────────────────────────────
export default function ForecastCards({ lat, lon }: { lat: number; lon: number }) {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lon) return;
    const ctrl = new AbortController();
    fetch(`/api/forecast?lat=${lat}&lon=${lon}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: ForecastResponse) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [lat, lon]);

  const hourly = data?.hourly ?? [];

  return (
    <div className="grid grid-cols-2 gap-3">
      {(["wind", "uv", "humidity", "visibility"] as ForecastMetric[]).map((m) => (
        <ForecastCard key={m} metric={m} hourly={hourly} loading={loading} />
      ))}
    </div>
  );
}
