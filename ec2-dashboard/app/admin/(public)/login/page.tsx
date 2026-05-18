'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { login, verify2fa, setToken, adminHomePath, isAdminRole } from '@/lib/api';
import OtpInput from '@/components/auth/OtpInput';
import AuthShell from '@/components/layout/AuthShell';

export default function AdminLoginPage() {
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
      const res = await login(email, password);
      if (res.requires2FA || res.tempToken) {
        setTempToken(res.tempToken);
        setStep('2fa');
      } else {
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        if (!isAdminRole(payload.role)) {
          setError('Solo cuentas administrador pueden acceder a este panel');
          return;
        }
        setToken(res.token);
        router.push(adminHomePath());
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verify2fa(code, tempToken);
      const payload = JSON.parse(atob(res.token.split('.')[1]));
      if (!isAdminRole(payload.role)) {
        setError('Solo cuentas administrador pueden acceder a este panel');
        return;
      }
      setToken(res.token);
      router.push(adminHomePath());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="admin"
      heading="Inicia sesión en el panel"
      subtitle="Panel de administración"
      promoCta={{ href: '/', label: 'Volver al sitio' }}
    >
      <AnimatePresence mode="wait">
        {step === 'creds' ? (
          <motion.form
            key="creds"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handleLogin}
            className="auth-form"
          >
            <p className="auth-divider">Con email y contraseña</p>

            <div className="auth-form__fields">
              <div className="auth-field">
                <label className="auth-label" htmlFor="admin-email">
                  Correo electrónico
                </label>
                <motion.div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" aria-hidden />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                    placeholder="admin@email.com"
                    autoComplete="email"
                  />
                </motion.div>
              </div>

              <motion.div className="auth-field">
                <label className="auth-label" htmlFor="admin-password">
                  Contraseña
                </label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" aria-hidden />
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </motion.div>
            </div>

            {error ? (
              <div className="auth-alert" role="alert">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            ) : null}

            <div className="auth-form__footer">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary auth-submit"
              >
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
                {loading ? 'Iniciando…' : 'Continuar'}
              </motion.button>
              <p className="auth-form__links">
                <Link href="/admin/login/recover">¿Perdiste tu código 2FA?</Link>
              </p>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="2fa"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            onSubmit={handle2FA}
            className="auth-form"
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--green)' }}>
              <Shield size={18} aria-hidden />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Verificación 2FA
              </span>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              Ingresa el código de tu app de autenticación
            </p>

            <div className="auth-field w-full">
              <label
                className="mb-2 block text-center text-sm font-medium text-[var(--text-primary)]"
                htmlFor="admin-2fa"
              >
                Código de verificación
              </label>
              <OtpInput id="admin-2fa" value={code} onChange={setCode} autoFocus />
            </div>

            {error ? (
              <motion.div className="auth-alert" role="alert">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </motion.div>
            ) : null}

            <div className="auth-btn-row">
              <button
                type="button"
                onClick={() => {
                  setStep('creds');
                  setError('');
                }}
                className="btn-ghost flex-1"
              >
                Atrás
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary auth-submit flex-1"
              >
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : 'Verificar'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
