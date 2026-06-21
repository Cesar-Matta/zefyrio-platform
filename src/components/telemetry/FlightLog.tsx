"use client";
// FlightLog — Drone session logging UI.
// Persists to Supabase via /api/sessions; localStorage acts as offline cache and
// fallback when DEV_BYPASS is on or the network is down.

import { useState, useEffect } from "react";
import { BookOpen, Clock, MapPin, Trash2, Download, Plus, CloudOff, Cloud as CloudIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useStore } from "@/store/useStore";
import {
  loadCachedSessions,
  fetchSessions,
  createSession,
  deleteSession,
  type FlightSessionRow,
} from "@/lib/api/sessions";

const STATUS_COLORS: Record<string, string> = {
  GO: 'var(--color-system-green)',
  CAUTION: 'var(--color-system-orange)',
  'NO-GO': 'var(--color-system-red)',
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FlightLog() {
  const { t } = useTranslation();
  const { telemetryData, activeProfile } = useStore();
  const [sessions, setSessions] = useState<FlightSessionRow[]>(loadCachedSessions);
  const [sessionStart] = useState(() => Date.now());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchSessions().then(({ rows, live }) => {
      setSessions(rows);
      setIsLive(live);
    });
  }, []);

  const handleSave = async () => {
    if (!telemetryData) return;
    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const row = await createSession({
      status: telemetryData.status,
      profile: activeProfile,
      duration_seconds: elapsed,
      latitude: telemetryData.gps?.lat ?? null,
      longitude: telemetryData.gps?.lon ?? null,
      conditions: {
        temp: telemetryData.temperature,
        wind: telemetryData.surfaceWind?.speedStr,
        gusts: telemetryData.maxGusts,
        rain: telemetryData.rainChance,
        clouds: telemetryData.clouds,
        kp: telemetryData.kpIndex,
        visibility: telemetryData.visibility,
      },
    });
    setSessions(prev => [row, ...prev.filter(r => r.id !== row.id)]);
  };

  const handleDelete = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    await deleteSession(id);
  };

  const exportLog = () => {
    const csv = [
      'date,profile,status,duration_s,lat,lon,temp,wind,gusts,rain%,clouds%,kp',
      ...sessions.map(s =>
        [
          s.started_at,
          s.profile,
          s.status,
          s.duration_seconds,
          s.latitude ?? '',
          s.longitude ?? '',
          s.conditions.temp ?? '',
          s.conditions.wind ?? '',
          s.conditions.gusts ?? '',
          s.conditions.rain ?? '',
          s.conditions.clouds ?? '',
          s.conditions.kp ?? '',
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zefyrio_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: 'var(--z-cyan)' }} />
          <span className="text-[11px] tracking-[0.16em] font-bold" style={{ color: 'var(--z-text)' }}>
            {t('log_title')}
          </span>
          {/* Sync indicator */}
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider"
            style={{
              background: isLive ? 'rgba(0,255,102,0.1)' : 'rgba(255,184,0,0.1)',
              color: isLive ? 'var(--color-system-green)' : 'var(--color-system-orange)',
              border: `1px solid ${isLive ? 'rgba(0,255,102,0.3)' : 'rgba(255,184,0,0.3)'}`,
            }}
            title={isLive ? 'Sincronizado con la nube' : 'Solo local (offline o sin sesión)'}
          >
            {isLive ? <CloudIcon className="w-2.5 h-2.5" /> : <CloudOff className="w-2.5 h-2.5" />}
            {isLive ? 'SYNC' : 'LOCAL'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={exportLog}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[8px] font-bold tracking-wider transition cursor-pointer"
              style={{ background: 'var(--z-glass-bg)', border: '1px solid var(--z-border)', color: 'var(--z-muted)' }}
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!telemetryData}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[8px] font-bold tracking-wider transition cursor-pointer disabled: disabled:cursor-not-allowed"
            style={{ background: 'rgba(0,255,102,0.1)', border: '1px solid rgba(0,255,102,0.3)', color: 'var(--color-system-green)' }}
          >
            <Plus className="w-3 h-3" /> {t('log_save')}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-3"
          style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
        >
          <BookOpen className="w-8 h-8" style={{ color: 'var(--z-muted)' }} />
          <p className="text-[11px] font-data" style={{ color: 'var(--z-muted)' }}>{t('log_empty')}</p>
        </div>
      )}

      {/* Sessions */}
      {sessions.map((session) => {
        const statusColor = STATUS_COLORS[session.status] || 'var(--color-system-orange)';
        const isExpanded = expanded === session.id;
        return (
          <div
            key={session.id}
            className="rounded-2xl overflow-hidden transition-all cursor-pointer"
            style={{ background: 'var(--z-card)', border: '1px solid var(--z-border)' }}
            onClick={() => setExpanded(isExpanded ? null : session.id)}
          >
            <div className="p-4 flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}60` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-data" style={{ color: 'var(--z-text)' }}>
                    {session.status}
                  </span>
                  <span
                    className="text-[8px] font-data px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--z-surface)', color: 'var(--z-cyan)' }}
                  >
                    {session.profile.toUpperCase()}
                  </span>
                  {session._pending && (
                    <span className="text-[7px] font-data px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,184,0,0.15)', color: 'var(--color-system-orange)' }}>
                      PENDING
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-data mt-0.5" style={{ color: 'var(--z-muted)' }}>
                  {formatDate(session.started_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" style={{ color: 'var(--z-muted)' }} />
                <span className="text-[10px] font-black font-data" style={{ color: 'var(--z-text)' }}>
                  {formatDuration(session.duration_seconds)}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 animate-in fade-in duration-200">
                <div className="h-px mb-3" style={{ background: 'var(--z-border)' }} />
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'TEMP', value: session.conditions.temp != null ? `${session.conditions.temp}°C` : '–' },
                    { label: 'WIND', value: session.conditions.wind ? `${session.conditions.wind} kts` : '–' },
                    { label: 'GUSTS', value: session.conditions.gusts ? `${session.conditions.gusts} kts` : '–' },
                    { label: 'RAIN', value: session.conditions.rain != null ? `${session.conditions.rain}%` : '–' },
                    { label: 'CLOUDS', value: session.conditions.clouds != null ? `${session.conditions.clouds}%` : '–' },
                    { label: 'Kp', value: session.conditions.kp != null ? session.conditions.kp.toFixed(1) : '–' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-2 text-center" style={{ background: 'var(--z-surface)' }}>
                      <span className="text-[7px] font-data block" style={{ color: 'var(--z-muted)' }}>{item.label}</span>
                      <span className="text-[11px] font-black font-data" style={{ color: 'var(--z-text)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" style={{ color: 'var(--z-muted)' }} />
                    <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>
                      {session.latitude?.toFixed(4) ?? '–'}, {session.longitude?.toFixed(4) ?? '–'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                    className="p-1.5 rounded-lg transition cursor-pointer hover:"
                    style={{ background: 'rgba(255,0,85,0.1)' }}
                  >
                    <Trash2 className="w-3 h-3" style={{ color: 'var(--color-system-red)' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
