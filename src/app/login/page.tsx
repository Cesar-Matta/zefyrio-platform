"use client";

import { useState } from 'react';
import { PlaneTakeoff, Github, Mail, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      alert("Error al enviar enlace: " + error.message);
    } else {
      setSent(true);
    }
    
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
        console.error(error);
        alert("Fallo de acceso militar vía " + provider);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-0 md:p-8 font-sans relative overflow-hidden">
      {/* Background Graphic Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="w-full max-w-[430px] h-[100dvh] md:h-[932px] bg-obsidian relative overflow-hidden md:rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center border-[10px] md:border-x-[12px] md:border-y-[24px] border-[#0a0a0a] z-10">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="w-full h-full px-8 py-12 flex flex-col relative z-10">
            {/* Header / Logo */}
            <div className="flex flex-col items-center justify-center mt-16 mb-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-cyan/20 to-transparent border border-cyber-cyan/30 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                    <PlaneTakeoff className="w-10 h-10 text-cyber-cyan relative z-10" />
                    <div className="absolute inset-0 rounded-full bg-cyber-cyan/10 animate-ping opacity-50 duration-3000" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">ZEFYRIO</h1>
                <p className="text-[10px] font-mono text-cyber-cyan tracking-[0.3em] uppercase mt-2 opacity-80">Aero HUD Protocol</p>
            </div>

            {/* Login Frame */}
            <div className="flex-1 flex flex-col gap-5 w-full">
                
                {/* Email Login Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4 p-6 rounded-3xl bg-[#111625]/60 border border-white/10 backdrop-blur-xl relative">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-300 font-mono tracking-widest uppercase">Acceso Piloto</span>
                    </div>

                    {!sent ? (
                        <>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="codenigma@zefyrio.com"
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                            />
                            
                            <button 
                                disabled={loading}
                                type="submit" 
                                className="w-full bg-white text-obsidian font-black rounded-xl py-4 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'ESCANENANDO...' : 'ENLACE MÁGICO'}
                                {!loading && <Mail className="w-4 h-4" />}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-6 flex flex-col items-center gap-3">
                            <Mail className="w-8 h-8 text-radium-go mb-2" />
                            <p className="text-white text-sm font-bold">Enlace enviado a:</p>
                            <p className="text-cyber-cyan font-mono text-xs">{email}</p>
                            <p className="text-gray-400 text-[10px] mt-2">Revisa tu bandeja de entrada o spam. El enlace expira en 15 minutos.</p>
                        </div>
                    )}
                </form>

                <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-gray-600 font-mono">O</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* OAuth Login */}
                <button type="button" onClick={() => handleOAuth('github')} className="w-full bg-[#111625]/40 border border-white/5 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                    <Github className="w-5 h-5" />
                    Continuar con Github
                </button>
                <button type="button" onClick={() => handleOAuth('google')} className="w-full bg-[#111625]/40 border border-white/5 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                    {/* Google SVG Icon inline */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Continuar con Google
                </button>
            </div>
            
            <p className="text-center text-gray-600 text-[10px] mt-8">
                Al conectar tu credencial militar, aceptas todos los Términos M/S. 
                El uso del espacio aéreo es responsabilidad del portador.
            </p>
        </div>
      </main>
    </div>
  );
}
