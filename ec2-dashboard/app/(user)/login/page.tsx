'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Mail, Lock, Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { login, verify2fa, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'creds' | '2fa'>('creds');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login(email, password);
      if (res.tempToken) { setTempToken(res.tempToken); setStep('2fa'); }
      else { setToken(res.token); router.push('/dashboard'); }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await verify2fa(code, tempToken);
      setToken(res.token);
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 pointer-events-none" style={{ background: 'var(--green)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 text-slate-500 hover:text-white transition-colors text-sm">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <ShoppingBag size={17} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">freck.lat</p>
            <p className="text-xs text-slate-500">Iniciar sesión</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-7">
          <AnimatePresence mode="wait">
            {step === 'creds' ? (
              <motion.form key="creds" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-5">Bienvenido de vuelta</h2>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
                      onFocus={e => e.target.style.borderColor = 'var(--green)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      placeholder="tu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
                      onFocus={e => e.target.style.borderColor = 'var(--green)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      placeholder="••••••••" />
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg bg-red-500/10"><AlertCircle size={13} />{error}</div>}
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-2.5 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--green)' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </motion.button>
                <p className="text-center text-xs text-slate-500">
                  ¿No tienes cuenta? <Link href="/register" className="hover:text-white transition-colors" style={{ color: 'var(--green)' }}>Regístrate</Link>
                </p>
              </motion.form>
            ) : (
              <motion.form key="2fa" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} onSubmit={handle2FA} className="space-y-4">
                <div className="flex items-center gap-2 mb-5" style={{ color: 'var(--green)' }}>
                  <Shield size={18} />
                  <h2 className="text-lg font-bold text-white">Verificación 2FA</h2>
                </div>
                <p className="text-sm text-slate-400 mb-4">Ingresa el código de tu app de autenticación</p>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} required maxLength={6} autoFocus
                  className="w-full rounded-lg px-4 py-4 text-3xl text-center tracking-[0.4em] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
                  placeholder="000000" />
                {error && <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg bg-red-500/10"><AlertCircle size={13} />{error}</div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep('creds')} className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Atrás
                  </button>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'var(--green)' }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Verificar'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
