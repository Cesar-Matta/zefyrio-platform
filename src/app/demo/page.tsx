"use client";

// Guest demo entry — signs the visitor in anonymously (Supabase) and drops them
// straight into the HUD, no registration. Linked from nodyt.com (Zefyrio CTA).
// Requires "Anonymous sign-ins" enabled in the Supabase project.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-invoke in StrictMode
    ran.current = true;

    (async () => {
      const supabase = createClient();
      // Already signed in (returning guest or real user) → go straight in.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace('/');
        return;
      }
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setError('No se pudo iniciar el demo. Intenta de nuevo o entra con tu cuenta.');
        return;
      }
      router.replace('/');
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--z-surface)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-cyan/20 to-transparent border border-[var(--z-border)]/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.15)]">
          <PlaneTakeoff className="w-10 h-10 text-[var(--z-muted)] relative z-10" />
          <div className="absolute inset-0 rounded-full bg-[var(--z-surface)]/10 animate-ping" />
        </div>
        {error ? (
          <div className="flex flex-col items-center gap-4 max-w-xs">
            <p className="text-sm text-[var(--color-system-red)]">{error}</p>
            <a href="/login" className="text-xs font-medium tracking-tight text-[var(--z-muted)] hover:text-[var(--z-text)] transition-colors">
              Ir a iniciar sesión →
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-5 h-5 text-[var(--z-muted)] animate-spin" />
            <p className="text-[11px] font-medium text-[var(--z-muted)] tracking-tight">
              Preparando el demo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
