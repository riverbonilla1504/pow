'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Mail, Lock, Phone, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { register, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await register(email, password, phone || undefined);
      setToken(res.token);
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const perks = ['Crea y rastrea tus órdenes', 'Notificaciones por email automáticas', 'SMS en órdenes +$500'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 pointer-events-none" style={{ background: 'var(--green)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 text-slate-500 hover:text-white transition-colors text-sm">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <ShoppingBag size={17} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">freck.lat</p>
            <p className="text-xs text-slate-500">Crear cuenta</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-7">
          <h2 className="text-xl font-bold text-white mb-2">Crea tu cuenta</h2>
          <div className="space-y-1 mb-6">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle size={12} style={{ color: 'var(--green)' }} /> {p}
              </div>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
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
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Teléfono <span className="normal-case text-slate-600">(opcional — para SMS)</span></label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  placeholder="+573001234567" />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg bg-red-500/10"><AlertCircle size={13} />{error}</div>}
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--green)' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </motion.button>
            <p className="text-center text-xs text-slate-500">
              ¿Ya tienes cuenta? <Link href="/login" className="hover:text-white transition-colors" style={{ color: 'var(--green)' }}>Inicia sesión</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
