'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Lock, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

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
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      if (res.tempToken) {
        setTempToken(res.tempToken);
        setStep('2fa');
      } else {
        api.setToken(res.token);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.verify2fa(tempToken, code);
      api.setToken(res.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79,126,248,0.12) 0%, #0f1117 60%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(79,126,248,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(79,126,248,0.3) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md glass rounded-2xl p-8 glow">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ECommerce Admin</h1>
            <p className="text-xs text-slate-400">Notification System</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'creds' ? (
            <motion.form key="creds" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="admin@freck.lat" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="••••••••" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} onSubmit={handle2FA} className="space-y-4">
              <div className="flex items-center gap-2 text-brand-400 mb-4">
                <Shield size={18} />
                <p className="text-sm">Enter your 6-digit authenticator code</p>
              </div>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} required maxLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-2xl text-center tracking-[0.5em] text-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="000000" autoFocus />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('creds')}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 text-sm transition-colors">
                  Back
                </button>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-2 flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                  Verify
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
