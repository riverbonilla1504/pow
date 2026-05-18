'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { register, setToken } from '@/lib/api';
import AuthShell from '@/components/layout/AuthShell';

const PERKS = [
  'Crea y rastrea tus órdenes',
  'Notificaciones por email automáticas',
  'SMS en órdenes de alto valor',
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register(email, password, phone || undefined);
      setToken(res.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading="Crea tu cuenta"
      hint={
        <>
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </>
      }
      backHref="/"
      backLabel="Volver al inicio"
    >
      <form onSubmit={handleRegister} className="auth-form">
        <ul className="auth-perks">
          {PERKS.map((p) => (
            <li key={p} className="auth-perk">
              <CheckCircle size={14} aria-hidden />
              {p}
            </li>
          ))}
        </ul>

        <p className="auth-divider">Con email y contraseña</p>

        <div className="auth-form__fields">
          <motion.div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              Correo electrónico
            </label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" aria-hidden />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
          </motion.div>

          <motion.div className="auth-field">
            <label className="auth-label" htmlFor="register-password">
              Contraseña
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
          </motion.div>

          <motion.div className="auth-field">
            <label className="auth-label" htmlFor="register-phone">
              Teléfono{' '}
              <span className="auth-label__optional">(opcional — para SMS)</span>
            </label>
            <div className="auth-input-wrap">
              <Phone size={16} className="auth-input-icon" aria-hidden />
              <input
                id="register-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="auth-input"
                placeholder="+573001234567"
                autoComplete="tel"
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
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </motion.button>
        </div>
      </form>
    </AuthShell>
  );
}
