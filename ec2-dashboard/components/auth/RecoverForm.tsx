'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertCircle, Mail, Lock, Key } from 'lucide-react';
import { setToken, isAdminHost } from '@/lib/api';

interface RecoverFormProps {
  variant?: 'user' | 'admin';
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.freck.lat';

export default function RecoverForm({ variant = 'user' }: RecoverFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = variant === 'admin';

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/2fa/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, backupCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Recovery failed');

      if (isAdmin) {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.role !== 'admin') {
          setError('Solo cuentas administrador pueden acceder a este panel');
          return;
        }
      }

      setToken(data.token);
      router.push(isAdmin ? '/' : '/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="glass rounded-2xl p-7">
      <div className="flex items-center gap-2 mb-5" style={{ color: 'var(--green)' }}>
        <Shield size={18} />
        <h2 className="text-lg font-bold text-white">Recuperar acceso</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Ingresa tus credenciales y un código de respaldo para recuperar el acceso a tu cuenta.
      </p>
      <form onSubmit={handleRecover} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
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
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              placeholder="••••••••" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Código de respaldo</label>
          <div className="relative">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" value={backupCode} onChange={e => setBackupCode(e.target.value)} required
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              placeholder="a1b2c3d4" />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg bg-red-500/10">
            <AlertCircle size={13} />{error}
          </div>
        )}
        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          className="w-full py-2.5 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'var(--green)' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Recuperando...' : 'Recuperar acceso'}
        </motion.button>
      </form>
    </div>
  );
}
