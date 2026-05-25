// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — Push Notification API
// GET    /api/push  → VAPID public key + ready flag
// POST   /api/push  → Subscribe (save to Supabase)
// DELETE /api/push  → Unsubscribe (remove from Supabase)
// PUT    /api/push  → Manual trigger (internal test)
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY             || '';
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT || 'mailto:admin@zefyrio.app';
const DEV_BYPASS        = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

// Dev-only fallback when bypass auth is active (no real user session)
let devSubscriptionStore: { endpoint: string; keys: { p256dh: string; auth: string } } | null = null;

// ─── GET — VAPID public key ───────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    vapidPublicKey: VAPID_PUBLIC_KEY,
    ready: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
  });
}

// ─── POST — Save subscription ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, lat, lon } = body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      lat?: number;
      lon?: number;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    if (DEV_BYPASS) {
      devSubscriptionStore = { endpoint, keys };
      return NextResponse.json({ success: true, mode: 'dev' });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: req.headers.get('user-agent') ?? undefined,
        last_lat: lat ?? null,
        last_lon: lon ?? null,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('[Push] DB insert error:', error.message);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE — Remove subscription ────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (DEV_BYPASS) {
    devSubscriptionStore = null;
    return NextResponse.json({ success: true, mode: 'dev' });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { endpoint?: string };
    const query = supabase.from('push_subscriptions').delete();
    if (body.endpoint) {
      await query.eq('endpoint', body.endpoint).eq('user_id', user.id);
    } else {
      await query.eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT — Manual test trigger ────────────────────────────────────
export async function PUT(req: NextRequest) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'VAPID keys not configured.' },
      { status: 503 }
    );
  }

  let subscription: { endpoint: string; keys: { p256dh: string; auth: string } } | null = null;

  if (DEV_BYPASS) {
    subscription = devSubscriptionStore;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (data) subscription = { endpoint: data.endpoint, keys: { p256dh: data.p256dh, auth: data.auth } };
    }
  }

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  try {
    const payload = await req.json();
    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      JSON.stringify({
        title: payload.title || '⚠️ Zefyrio Alert',
        body:  payload.body  || 'Weather conditions have changed.',
        tag:   payload.tag   || 'weather-alert',
        url:   '/',
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 410) {
      return NextResponse.json({ error: 'Subscription expired', expired: true }, { status: 410 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
