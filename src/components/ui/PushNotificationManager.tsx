"use client";
// PushNotificationManager — Weather alert push subscription UI
// Manages SW registration + VAPID subscription lifecycle

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type PushStatus = 'idle' | 'unsupported' | 'denied' | 'subscribed' | 'subscribing' | 'error';

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function PushNotificationManager() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PushStatus>('idle');
  const [vapidKey, setVapidKey] = useState<string>('');
  const [vapidReady, setVapidReady] = useState(false);

  // Check current push status on mount
  useEffect(() => {
    const init = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('unsupported');
        return;
      }

      // Fetch VAPID public key from API
      try {
        const res = await fetch('/api/push');
        const data = await res.json();
        if (data.ready) {
          setVapidKey(data.vapidPublicKey);
          setVapidReady(true);
        }
      } catch { /* API key not configured */ }

      // Check existing permission
      const perm = Notification.permission;
      if (perm === 'denied') { setStatus('denied'); return; }

      // Check if already subscribed
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) setStatus('subscribed');
      } catch { /* ignore */ }
    };

    init();
  }, []);

  const subscribe = async () => {
    if (!vapidReady) return;
    setStatus('subscribing');

    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      // Get current coordinates to enable cron evaluator
      let lat: number | undefined;
      let lon: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch { /* location optional */ }

      // Send to server
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subscription.toJSON(), lat, lon }),
      });

      setStatus('subscribed');
    } catch (err) {
      console.error('[Push] Subscribe error:', err);
      setStatus('error');
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch('/api/push', { method: 'DELETE' });
      setStatus('idle');
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err);
      setStatus('error');
    }
  };

  // ─── Render states ───────────────────────────────────────────────
  if (status === 'unsupported') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)' }}>
        <Info className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--z-muted)' }} />
        <span className="text-[9px] font-data" style={{ color: 'var(--z-muted)' }}>
          {t('push_unsupported')}
        </span>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.2)' }}>
        <BellOff className="w-3 h-3 flex-shrink-0" style={{ color: '#ff0055' }} />
        <span className="text-[9px] font-data" style={{ color: '#ff0055' }}>
          {t('push_denied')}
        </span>
      </div>
    );
  }

  if (!vapidReady && status === 'idle') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)' }}>
        <Info className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--z-muted)' }} />
        <span className="text-[9px] font-data" style={{ color: 'var(--z-muted)' }}>
          {t('push_not_configured')}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={status === 'subscribed' ? unsubscribe : subscribe}
      disabled={status === 'subscribing'}
      className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition cursor-pointer disabled:opacity-50"
      style={{
        background: status === 'subscribed' ? 'rgba(0,255,102,0.08)' : 'var(--z-surface)',
        border: `1px solid ${status === 'subscribed' ? 'rgba(0,255,102,0.3)' : 'var(--z-border)'}`,
      }}
    >
      {status === 'subscribing' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--z-cyan)' }} />
      ) : status === 'subscribed' ? (
        <BellRing className="w-3.5 h-3.5" style={{ color: '#00ff66' }} />
      ) : (
        <Bell className="w-3.5 h-3.5" style={{ color: 'var(--z-muted)' }} />
      )}
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-[10px] font-bold font-data"
          style={{ color: status === 'subscribed' ? '#00ff66' : 'var(--z-text)' }}>
          {status === 'subscribed' ? t('push_active') : t('push_enable')}
        </span>
        <span className="text-[8px] font-data" style={{ color: 'var(--z-muted)' }}>
          {status === 'subscribed' ? t('push_active_sub') : t('push_enable_sub')}
        </span>
      </div>
      {status === 'subscribed' && (
        <div className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#00ff66', boxShadow: '0 0 6px #00ff66' }} />
      )}
    </button>
  );
}
