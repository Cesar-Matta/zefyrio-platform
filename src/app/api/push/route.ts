// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — Push Notification API Route
// POST   /api/push  → Save subscription
// DELETE /api/push  → Remove subscription
// PUT    /api/push  → Send push to saved subscription (server trigger)
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

// ─── VAPID Config ────────────────────────────────────────────────
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY             || '';
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT                 || 'mailto:admin@zefyrio.app';

interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}

// In-memory store (replace with Supabase for multi-device support)
let pushSubscriptionStore: StoredSubscription | null = null;

// ─── GET — Return VAPID public key for client ─────────────────────
export async function GET() {
  return NextResponse.json({
    vapidPublicKey: VAPID_PUBLIC_KEY,
    ready: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
  });
}

// ─── POST — Save push subscription ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const subscription = (await req.json()) as StoredSubscription;
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    pushSubscriptionStore = subscription;
    console.log('[Push] Subscription saved:', subscription.endpoint.slice(0, 50) + '...');
    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

// ─── DELETE — Remove subscription ────────────────────────────────
export async function DELETE() {
  pushSubscriptionStore = null;
  return NextResponse.json({ success: true, message: 'Subscription removed' });
}

// ─── PUT — Trigger push notification (internal use) ──────────────
export async function PUT(req: NextRequest) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.' },
      { status: 503 }
    );
  }

  if (!pushSubscriptionStore) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  try {
    const payload = await req.json();

    // Dynamic import to avoid server-side issues in dev
    const webpush = await import('web-push').catch(() => null);
    if (!webpush) {
      return NextResponse.json({ error: 'web-push not installed. Run: npm install web-push' }, { status: 501 });
    }

    webpush.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    await webpush.default.sendNotification(
      pushSubscriptionStore,
      JSON.stringify({
        title: payload.title || '⚠️ Zefyrio Alert',
        body:  payload.body  || 'Weather conditions have changed.',
        tag:   payload.tag   || 'weather-alert',
        url:   '/',
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Push] Send error:', err);
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 410) {
      pushSubscriptionStore = null;
      return NextResponse.json({ error: 'Subscription expired', expired: true }, { status: 410 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
