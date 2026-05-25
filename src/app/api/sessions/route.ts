// /api/sessions — Flight session persistence (Supabase backend).
// GET    → list current user's sessions (newest first)
// POST   → insert a session
// DELETE ?id=<uuid>  → remove a session
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface FlightSessionRow {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  profile: string;
  status: 'GO' | 'CAUTION' | 'NO-GO';
  latitude: number | null;
  longitude: number | null;
  conditions: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET() {
  if (DEV_BYPASS) {
    return NextResponse.json({ sessions: [], source: 'dev-bypass' });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('flight_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [], source: 'live' });
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  // Minimal validation
  const { status, duration_seconds, profile, latitude, longitude, conditions, started_at, ended_at, notes } = body;
  if (!status || !['GO', 'CAUTION', 'NO-GO'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (DEV_BYPASS) {
    // Echo back a synthesized row — caller will fall back to localStorage.
    return NextResponse.json({
      session: {
        id: crypto.randomUUID(),
        user_id: 'dev-bypass',
        started_at: started_at ?? new Date().toISOString(),
        ended_at: ended_at ?? null,
        duration_seconds: duration_seconds ?? 0,
        profile: profile ?? 'dron',
        status,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        conditions: conditions ?? {},
        notes: notes ?? null,
        created_at: new Date().toISOString(),
      },
      source: 'dev-bypass',
    });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('flight_sessions')
    .insert({
      user_id:         user.id,
      started_at:      started_at ?? new Date().toISOString(),
      ended_at:        ended_at ?? null,
      duration_seconds: duration_seconds ?? 0,
      profile:         profile ?? 'dron',
      status,
      latitude:        latitude ?? null,
      longitude:       longitude ?? null,
      conditions:      conditions ?? {},
      notes:           notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data, source: 'live' });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (DEV_BYPASS) return NextResponse.json({ ok: true, source: 'dev-bypass' });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { error } = await supabase
    .from('flight_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Security: ensure users can only delete their own sessions

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'live' });
}
