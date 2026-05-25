"use client";
// FlightAnalytics — Session analytics dashboard
// Reads from localStorage 'zefyrio_flight_log', renders SVG sparklines
// No external chart library — pure SVG + CSS for zero bundle impact

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, BarChart2, Activity, Wind, Thermometer, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  loadCachedSessions,
  fetchSessions,
  type FlightSessionRow,
} from "@/lib/api/sessions";

// ─── Sparkline ────────────────────────────────────────────────────
function Sparkline({ values, color, height = 40, gradId }: { values: number[]; color: string; height?: number; gradId: string }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = height;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  const areaBottom = `${W},${H} 0,${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${pts} ${areaBottom}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last value dot */}
      {(() => {
        const last = values[values.length - 1];
        const x = W;
        const y = H - ((last - min) / range) * (H - 6) - 3;
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

// ─── DonutRing ───────────────────────────────────────────────────
function DonutRing({ go, caution, nogo }: { go: number; caution: number; nogo: number }) {
  const total = go + caution + nogo || 1;
  const R = 28;
  const C = 2 * Math.PI * R;

  const goArc     = (go / total) * C;
  const cautionArc = (caution / total) * C;
  const nogoArc   = (nogo / total) * C;

  const segments = [
    { color: '#00ff66', dash: goArc,     offset: 0 },
    { color: '#ffb800', dash: cautionArc, offset: goArc },
    { color: '#ff0055', dash: nogoArc,   offset: goArc + cautionArc },
  ];

  return (
    <svg viewBox="0 0 72 72" className="w-16 h-16">
      <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx="36" cy="36" r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="8"
          strokeDasharray={`${s.dash} ${C - s.dash}`}
          strokeDashoffset={-s.offset + C * 0.25}
          transform="rotate(-90 36 36)"
          style={{ filter: `drop-shadow(0 0 4px ${s.color}60)` }}
        />
      ))}
      <text x="36" y="40" textAnchor="middle" fontSize="11" fontWeight="800"
        fill="white" fontFamily="monospace">
        {total}
      </text>
    </svg>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-3 flex flex-col gap-0.5"
      style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
      <span className="text-[8px] uppercase tracking-widest font-bold"
        style={{ color: 'var(--z-muted)' }}>{label}</span>
      <span className="text-[18px] font-black font-data leading-none"
        style={{ color }}>{value}</span>
      {sub && <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>{sub}</span>}
    </div>
  );
}

export default function FlightAnalytics() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<FlightSessionRow[]>(loadCachedSessions);

  useEffect(() => {
    fetchSessions().then(({ rows }) => setSessions(rows));
  }, []);

  const stats = useMemo(() => {
    if (!sessions.length) return null;

    const go      = sessions.filter(s => s.status === 'GO').length;
    const caution = sessions.filter(s => s.status === 'CAUTION').length;
    const nogo    = sessions.filter(s => s.status === 'NO-GO').length;

    const temps = sessions.map(s => Number(s.conditions.temp)).filter(n => !isNaN(n));
    const winds = sessions.map(s => parseFloat(s.conditions.wind ?? '')).filter(n => !isNaN(n));
    const kps   = sessions.map(s => Number(s.conditions.kp)).filter(n => !isNaN(n));

    const avgTemp = temps.reduce((a, b) => a + b, 0) / (temps.length || 1);
    const avgWind = winds.reduce((a, b) => a + b, 0) / (winds.length || 1);
    const avgKp   = kps.reduce((a, b) => a + b, 0) / (kps.length || 1);

    const profileCounts: Record<string, number> = {};
    sessions.forEach(s => {
      profileCounts[s.profile] = (profileCounts[s.profile] || 0) + 1;
    });
    const topProfile = Object.entries(profileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const last10 = [...sessions].slice(0, 10).reverse();

    return { go, caution, nogo, total: sessions.length, avgTemp, avgWind, avgKp, topProfile, last10, profileCounts };
  }, [sessions]);

  if (!stats) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center gap-3"
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
        <BarChart2 className="w-8 h-8 opacity-20" style={{ color: 'var(--z-muted)' }} />
        <p className="text-[11px] text-center font-data" style={{ color: 'var(--z-muted)' }}>
          {t('analytics_no_data')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">

      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--z-cyan)' }} />
        <span className="text-[11px] uppercase tracking-[0.16em] font-bold" style={{ color: 'var(--z-text)' }}>
          {t('analytics_title')}
        </span>
      </div>

      {/* Status Overview Row */}
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
        <DonutRing go={stats.go} caution={stats.caution} nogo={stats.nogo} />
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-[9px] uppercase tracking-widest font-bold"
            style={{ color: 'var(--z-muted)' }}>{t('analytics_status_breakdown')}</span>
          {[
            { label: 'GO', count: stats.go, color: '#00ff66' },
            { label: 'CAUTION', count: stats.caution, color: '#ffb800' },
            { label: 'NO-GO', count: stats.nogo, color: '#ff0055' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: s.color, boxShadow: `0 0 5px ${s.color}60` }} />
              <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--z-surface)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(s.count / stats.total) * 100}%`,
                    background: s.color,
                    boxShadow: `0 0 6px ${s.color}`,
                  }} />
              </div>
              <span className="text-[9px] font-black font-data w-5 text-right"
                style={{ color: s.color }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Average Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label={t('weather_temp')} value={`${stats.avgTemp.toFixed(1)}°`} sub="avg" color="var(--z-cyan)" />
        <StatCard label={t('wind_surface')} value={`${stats.avgWind.toFixed(0)}`} sub="kts avg" color="#ffb800" />
        <StatCard label="Kp avg" value={stats.avgKp.toFixed(1)} sub="geomagnetic" color="#a78bfa" />
      </div>

      {/* Sparkline — Temperature Trend */}
      {stats.last10.length >= 2 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-3 h-3" style={{ color: 'var(--z-cyan)' }} />
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--z-muted)' }}>
              {t('analytics_temp_trend')}
            </span>
            <span className="ml-auto text-[9px] font-black font-data" style={{ color: 'var(--z-cyan)' }}>
              {stats.last10[stats.last10.length - 1]?.conditions.temp ?? '—'}°C
            </span>
          </div>
          <Sparkline values={stats.last10.map(s => Number(s.conditions.temp) || 0)} color="var(--z-cyan)" gradId="spark-temp" />
        </div>
      )}

      {/* Sparkline — Wind Trend */}
      {stats.last10.length >= 2 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Wind className="w-3 h-3" style={{ color: '#ffb800' }} />
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--z-muted)' }}>
              {t('analytics_wind_trend')}
            </span>
            <span className="ml-auto text-[9px] font-black font-data" style={{ color: '#ffb800' }}>
              {stats.last10[stats.last10.length - 1]?.conditions.wind ?? '—'} kts
            </span>
          </div>
          <Sparkline values={stats.last10.map(s => parseFloat(s.conditions.wind ?? '0') || 0)} color="#ffb800" gradId="spark-wind" />
        </div>
      )}

      {/* Sparkline — Kp Trend */}
      {stats.last10.length >= 2 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3 h-3" style={{ color: '#a78bfa' }} />
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--z-muted)' }}>
              {t('analytics_kp_trend')}
            </span>
            <span className="ml-auto text-[9px] font-black font-data" style={{ color: '#a78bfa' }}>
              Kp {stats.last10[stats.last10.length - 1]?.conditions.kp?.toFixed(1) || '—'}
            </span>
          </div>
          <Sparkline values={stats.last10.map(s => Number(s.conditions.kp) || 0)} color="#a78bfa" gradId="spark-kp" />
        </div>
      )}

      {/* Profile Usage */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3 h-3" style={{ color: 'var(--z-cyan)' }} />
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--z-muted)' }}>
            {t('analytics_profile_usage')}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(stats.profileCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([profile, count]) => (
              <div key={profile} className="flex items-center gap-2">
                <span className="text-[9px] font-bold font-data w-20 flex-shrink-0 capitalize"
                  style={{ color: 'var(--z-text)' }}>{profile}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--z-surface)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(count / stats.total) * 100}%`,
                      background: 'var(--z-cyan)',
                    }} />
                </div>
                <span className="text-[9px] font-black font-data w-5 text-right"
                  style={{ color: 'var(--z-muted)' }}>{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
