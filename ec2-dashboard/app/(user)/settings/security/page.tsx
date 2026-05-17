'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { hasToken, getMe } from '@/lib/api';
import TwoFactorEnroll from '@/components/auth/TwoFactorEnroll';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return; }
    getMe()
      .then((data: any) => setTotpEnabled(data.totp_enabled))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={24} className="animate-spin text-slate-500" />
      </div>
    );
  }

  if (enrolling) {
    return (
      <div className="auth-shell">
        <div className="auth-card glass rounded-2xl p-8">
          <TwoFactorEnroll
            onComplete={() => {
              setTotpEnabled(true);
              setEnrolling(false);
            }}
            onCancel={() => setEnrolling(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <ShoppingBag size={14} className="text-black" />
          </div>
          <span className="font-bold text-white text-sm">freck.lat</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
          <ArrowLeft size={14} /> Volver al dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Seguridad</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona la autenticación de dos factores de tu cuenta</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: totpEnabled ? 'rgba(0,237,100,0.1)' : 'rgba(255,255,255,0.06)',
                  border: totpEnabled ? '1px solid rgba(0,237,100,0.2)' : '1px solid var(--border)',
                }}>
                {totpEnabled
                  ? <ShieldCheck size={20} style={{ color: 'var(--green)' }} />
                  : <Shield size={20} className="text-slate-500" />}
              </div>
              <div>
                <h3 className="font-semibold text-white">Autenticación de dos factores (2FA)</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {totpEnabled
                    ? 'Tu cuenta está protegida con 2FA. Se te pedirá un código al iniciar sesión.'
                    : 'Añade una capa extra de seguridad usando una app como Google Authenticator o Authy.'}
                </p>
                {totpEnabled && (
                  <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(0,237,100,0.12)', color: 'var(--green)', border: '1px solid rgba(0,237,100,0.2)' }}>
                    <ShieldCheck size={12} /> Activo
                  </span>
                )}
              </div>
            </div>
            {!totpEnabled && (
              <motion.button onClick={() => setEnrolling(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-black flex-shrink-0"
                style={{ background: 'var(--green)' }}>
                Activar
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
