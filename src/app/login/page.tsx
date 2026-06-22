"use client";

import { useState } from 'react';
import { PlaneTakeoff, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
import { createClient } from '@/lib/supabase/client';

type PasswordAction = 'login' | 'signup';

export default function LoginPage() {
  const [action, setAction] = useState<PasswordAction>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (action === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Correo o contraseña incorrectos.');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setError('Revisa tu correo para confirmar tu cuenta.');
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError('No se pudo conectar con Google. Intenta de nuevo.');
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError('No se pudo iniciar el demo. Intenta de nuevo.');
      setLoading(false);
      return;
    }
    window.location.href = '/';
  };



  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-0 md:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--z-surface)]/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-[430px] h-[100dvh] md:h-auto bg-obsidian relative overflow-hidden md:rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center border-[10px] md:border-x-[12px] md:border-y-[24px] border-[#0a0a0a] z-10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="w-full h-full px-8 py-12 flex flex-col relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center justify-center mt-12 mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-cyan/20 to-transparent border border-[var(--z-border)]/30 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <img src="/logo-dark.png" alt="Cfyro Logo" className="w-12 h-12 relative z-10 object-contain" />
              <div className="absolute inset-0 rounded-full bg-[var(--z-surface)]/10 animate-ping duration-3000" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">CFYRO</h1>
            <p className="text-[10px] font-medium text-gray-400 tracking-tight mt-2 uppercase tracking-widest">Meteo HUD Táctico</p>
          </div>

          <div className="flex flex-col gap-4 w-full">

            {/* Password form */}
            <form onSubmit={handlePassword} className="flex flex-col gap-3 p-5 rounded-2xl bg-[#111625]/60 border border-[var(--z-border)] backdrop-blur-xl">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#111625]/80 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--z-border)]/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-[#111625]/80 border border-white/5 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--z-border)]/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs px-1" style={{ color: error.includes('confirmar') ? 'var(--color-system-green)' : 'var(--color-system-red)' }}>
                    {error}
                  </p>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-white text-obsidian font-black rounded-xl py-3.5 tracking-tight flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled: text-sm"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : action === 'login' ? 'Entrar' : 'Crear cuenta'}
                </button>

                <button
                  type="button"
                  onClick={() => { setAction(action === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-center mt-1"
                >
                  {action === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-gray-600 font-medium">O</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full bg-[#1a1f2e] border border-white/5 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-3 hover:bg-[#252a3a] transition-colors text-sm"
            >
              <GoogleIcon />
              Continuar con Google
            </button>



          </div>

          <p className="text-center text-gray-600 text-[10px] mt-8 leading-relaxed">
            Al acceder aceptas los Términos de Servicio de Cfyro.
          </p>
        </div>
      </main>
    </div>
  );
}
