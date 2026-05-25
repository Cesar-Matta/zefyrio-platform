// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — Weather Alert Cron
// Called by Vercel Cron every 15 minutes (vercel.json)
// Checks conditions for each push_subscription with known coordinates.
// Sends a Web Push if GO/CAUTION/NO-GO status changed since last check.
//
// Security: Vercel sets Authorization: Bearer <CRON_SECRET> automatically.
// Add CRON_SECRET to Vercel env vars.
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY             || '';
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT || 'mailto:admin@zefyrio.app';
const CRON_SECRET       = process.env.CRON_SECRET   || '';

// Service-role client bypasses RLS — required to read all subscriptions
function getAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase admin credentials not configured');
  return createClient(url, key);
}

type FlightStatus = 'GO' | 'CAUTION' | 'NO-GO';

interface WeatherEval {
  status: FlightStatus;
  wind: number;
  gusts: number;
  rain: number;
}

// Lightweight Open-Meteo fetch — only the fields we need for GO/NO-GO
async function evalWeather(lat: number, lon: number): Promise<WeatherEval> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_gusts_10m,precipitation_probability&wind_speed_unit=kmh&timezone=auto`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();
  const c = json.current;
  const wind  = c.wind_speed_10m   ?? 0;
  const gusts = c.wind_gusts_10m   ?? 0;
  const rain  = c.precipitation_probability ?? 0;

  let status: FlightStatus = 'GO';
  if (wind > 40 || gusts > 55 || rain > 70) status = 'NO-GO';
  else if (wind > 25 || gusts > 35 || rain > 40) status = 'CAUTION';

  return { status, wind, gusts, rain };
}

function buildPayload(status: FlightStatus, prev: FlightStatus | null, eval_: WeatherEval) {
  const emoji = status === 'NO-GO' ? '🔴' : status === 'CAUTION' ? '🟡' : '🟢';
  const title = `${emoji} Zefyrio — ${status}`;
  const change = prev ? `${prev} → ${status}` : status;
  const body = `Estado cambió a ${change}. Viento: ${Math.round(eval_.wind)} km/h, Ráfagas: ${Math.round(eval_.gusts)} km/h, Lluvia: ${eval_.rain}%`;
  return { title, body, tag: 'weather-status', url: '/' };
}

export async function GET(req: NextRequest) {
  // Vercel automatically adds Authorization: Bearer <CRON_SECRET>
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID not configured', skipped: true });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, skipped: true });
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, last_lat, last_lon, last_status')
    .not('last_lat', 'is', null)
    .not('last_lon', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscriptions with coordinates' });
  }

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sub of subscriptions) {
    try {
      const eval_ = await evalWeather(sub.last_lat, sub.last_lon);
      const prev = sub.last_status as FlightStatus | null;

      // Only notify on status change (or if no previous status recorded)
      if (eval_.status === prev) { skipped++; continue; }

      const payload = buildPayload(eval_.status, prev, eval_);
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );

      // Update last_status
      await supabase
        .from('push_subscriptions')
        .update({ last_status: eval_.status, last_used_at: new Date().toISOString() })
        .eq('id', sub.id);

      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410) {
        // Subscription expired — clean it up
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  return NextResponse.json({ sent, skipped, errors: errors.length ? errors : undefined });
}
