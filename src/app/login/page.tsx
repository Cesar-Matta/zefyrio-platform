"use client";

import { useState } from 'react';
import { PlaneTakeoff, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'password' | 'magic';
type PasswordAction = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password');
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) setError('No se pudo enviar el enlace. Intenta de nuevo.');
    else setSent(true);

    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-0 md:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-[430px] h-[100dvh] md:h-auto bg-obsidian relative overflow-hidden md:rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center border-[10px] md:border-x-[12px] md:border-y-[24px] border-[#0a0a0a] z-10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="w-full h-full px-8 py-12 flex flex-col relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center justify-center mt-12 mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-cyan/20 to-transparent border border-cyber-cyan/30 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <PlaneTakeoff className="w-10 h-10 text-cyber-cyan relative z-10" />
              <div className="absolute inset-0 rounded-full bg-cyber-cyan/10 animate-ping opacity-50 duration-3000" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">ZEFYRIO</h1>
            <p className="text-[10px] font-mono text-cyber-cyan tracking-[0.3em] uppercase mt-2 opacity-80">Aero HUD Protocol</p>
          </div>

          <div className="flex flex-col gap-4 w-full">

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/30 p-1 gap-1">
              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); setSent(false); }}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                style={{
                  background: mode === 'password' ? 'rgba(0,240,255,0.12)' : 'transparent',
                  color: mode === 'password' ? '#00F0FF' : '#6b7280',
                  border: mode === 'password' ? '1px solid rgba(0,240,255,0.3)' : '1px solid transparent',
                }}
              >
                Contraseña
              </button>
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(''); setSent(false); }}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                style={{
                  background: mode === 'magic' ? 'rgba(0,240,255,0.12)' : 'transparent',
                  color: mode === 'magic' ? '#00F0FF' : '#6b7280',
                  border: mode === 'magic' ? '1px solid rgba(0,240,255,0.3)' : '1px solid transparent',
                }}
              >
                Link por email
              </button>
            </div>

            {/* Password form */}
            {mode === 'password' && (
              <form onSubmit={handlePassword} className="flex flex-col gap-3 p-5 rounded-2xl bg-[#111625]/60 border border-white/10 backdrop-blur-xl">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all text-sm"
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
                  <p className="text-xs px-1" style={{ color: error.includes('confirmar') ? '#00ff66' : '#ff0055' }}>
                    {error}
                  </p>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-white text-obsidian font-black rounded-xl py-3.5 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
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
            )}

            {/* Magic link form */}
            {mode === 'magic' && (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3 p-5 rounded-2xl bg-[#111625]/60 border border-white/10 backdrop-blur-xl">
                {!sent ? (
                  <>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Te enviamos un enlace a tu correo. Haz click en él y entras directo — sin contraseña.
                    </p>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all text-sm"
                    />
                    {error && <p className="text-xs text-[#ff0055] px-1">{error}</p>}
                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full bg-white text-obsidian font-black rounded-xl py-3.5 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Enviar enlace</>}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-[#00ff66]" />
                    </div>
                    <p className="text-white text-sm font-bold">Revisa tu correo</p>
                    <p className="text-cyber-cyan font-mono text-xs">{email}</p>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Te mandamos un enlace de acceso. Expira en 15 minutos. Si no lo ves, revisa spam.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSent(false); setEmail(''); }}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
                    >
                      Usar otro correo
                    </button>
                  </div>
                )}
              </form>
            )}

          </div>

          <p className="text-center text-gray-600 text-[10px] mt-8 leading-relaxed">
            Al acceder aceptas los Términos de Servicio de Zefyrio.
          </p>
        </div>
      </main>
    </div>
  );
}
