"use client";
// UserMenu — avatar button + dropdown with profile, theme toggle, sign out.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/providers/ThemeProvider';

interface SupabaseUser {
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(
    isDevBypass ? { email: 'dev@zefyrio.local', user_metadata: { full_name: 'Dev Mode' } } : null
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isDevBypass) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user as SupabaseUser | null));
  }, [supabase]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleSignOut = async () => {
    if (isDevBypass) {
      alert('Modo desarrollo activo (NEXT_PUBLIC_DEV_BYPASS_AUTH=true). El logout solo aplica con auth real.');
      return;
    }
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Piloto';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div ref={wrapperRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition shrink-0 cursor-pointer hover:brightness-110"
        style={{
          backgroundColor: 'var(--z-glass-bg)',
          border: '1px solid var(--z-border)',
        }}
        aria-label="Menú de usuario"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5" style={{ color: 'var(--z-cyan)' }} strokeWidth={2} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-12 w-56 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: 'var(--z-surface)',
            border: '1px solid var(--z-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* User info */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--z-border)' }}>
            <p className="text-xs font-bold truncate" style={{ color: 'var(--z-text)' }}>
              {displayName}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--z-text)' }}>
              {user?.email || '—'}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <MenuItem icon={User} label="Mi perfil" onClick={() => { setOpen(false); /* TODO: profile page */ }} disabled />
            <MenuItem icon={Settings} label="Configuración" onClick={() => { setOpen(false); /* TODO */ }} disabled />
          </div>

          {/* Theme toggle */}
          <div className="border-t" style={{ borderColor: 'var(--z-border)' }}>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-white/5"
              style={{ color: 'var(--z-text)' }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="flex-1 text-left">
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </span>
            </button>
          </div>

          {/* Sign out */}
          <div className="py-1 border-t" style={{ borderColor: 'var(--z-border)' }}>
            <MenuItem icon={LogOut} label="Cerrar sesión" onClick={handleSignOut} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, disabled, danger }: {
  icon: typeof User; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-white/5 disabled: disabled:cursor-not-allowed"
      style={{ color: danger ? 'var(--color-system-red)' : 'var(--z-text)' }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="flex-1 text-left">{label}</span>
      {disabled && <span className="text-[8px]">Pronto</span>}
    </button>
  );
}

