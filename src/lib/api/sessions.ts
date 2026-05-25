// Sessions client — talks to /api/sessions with localStorage as offline cache + fallback.
// Always returns DB-shaped rows so the UI never branches on storage origin.

export type FlightStatus = 'GO' | 'CAUTION' | 'NO-GO';

export interface FlightSessionRow {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  profile: string;
  status: FlightStatus;
  latitude: number | null;
  longitude: number | null;
  conditions: {
    temp?: number;
    wind?: string;
    gusts?: string;
    rain?: number;
    clouds?: number;
    kp?: number;
    visibility?: string;
  };
  notes: string | null;
  created_at: string;
  _local?: boolean;       // marker: this row only exists in localStorage
  _pending?: boolean;     // marker: tried to sync but failed
}

const LS_KEY = 'zefyrio_flight_sessions_v2';

function readLocal(): FlightSessionRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocal(rows: FlightSessionRow[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 200))); } catch {}
}

export function loadCachedSessions(): FlightSessionRow[] {
  return readLocal();
}

export async function fetchSessions(): Promise<{ rows: FlightSessionRow[]; live: boolean }> {
  try {
    const res = await fetch('/api/sessions', { cache: 'no-store' });
    if (!res.ok) {
      return { rows: readLocal(), live: false };
    }
    const data = await res.json();
    const rows = (data.sessions as FlightSessionRow[]) ?? [];
    if (data.source === 'live') {
      // Merge: keep any locally-pending rows that haven't been synced.
      const localPending = readLocal().filter(r => r._pending || r._local);
      const merged = [...localPending, ...rows];
      writeLocal(merged);
      return { rows: merged, live: true };
    }
    // dev-bypass → use local
    return { rows: readLocal(), live: false };
  } catch {
    return { rows: readLocal(), live: false };
  }
}

export interface NewSessionInput {
  status: FlightStatus;
  profile: string;
  duration_seconds: number;
  latitude: number | null;
  longitude: number | null;
  conditions: FlightSessionRow['conditions'];
  started_at?: string;
  ended_at?: string;
  notes?: string;
}

export async function createSession(input: NewSessionInput): Promise<FlightSessionRow> {
  const optimistic: FlightSessionRow = {
    id: crypto.randomUUID(),
    user_id: 'pending',
    started_at: input.started_at ?? new Date().toISOString(),
    ended_at: input.ended_at ?? null,
    duration_seconds: input.duration_seconds,
    profile: input.profile,
    status: input.status,
    latitude: input.latitude,
    longitude: input.longitude,
    conditions: input.conditions,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
    _local: true,
    _pending: true,
  };

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const server = data.session as FlightSessionRow;
    const final = { ...server, _local: data.source !== 'live' };
    writeLocal([final, ...readLocal().filter(r => r.id !== final.id)]);
    return final;
  } catch {
    writeLocal([optimistic, ...readLocal()]);
    return optimistic;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  // Optimistic local delete
  writeLocal(readLocal().filter(r => r.id !== id));
  try {
    const res = await fetch(`/api/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}
