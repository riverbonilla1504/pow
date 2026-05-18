'use client';

/**
 * RecoverForm — formulario de recuperación de cuenta con código de respaldo.
 * Permite login cuando el usuario perdió acceso a su app TOTP.
 * Requiere: email, password, y uno de los 8 códigos de respaldo generados.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertCircle, Mail, Lock, Key } from 'lucide-react';
import { setToken, recover2fa, adminHomePath, isAdminRole } from '@/lib/api';

interface RecoverFormProps {
  variant?: 'user' | 'admin';
}

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
    setLoading(true);
    setError('');
    try {
      const data = await recover2fa(email, password, backupCode);

      if (isAdmin) {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (!isAdminRole(payload.role)) {
          setError('Solo cuentas administrador pueden acceder a este panel');
          return;
        }
      }

      setToken(data.token);
      router.push(isAdmin ? adminHomePath() : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al recuperar acceso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleRecover} className="auth-form">
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Ingresa tus credenciales y un código de respaldo para recuperar el acceso a tu cuenta.
      </p>

      <p className="auth-divider">Datos de recuperación</p>

      <div className="auth-form__fields">
        <div className="auth-field">
          <label className="auth-label" htmlFor="recover-email">
            Correo electrónico
          </label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" aria-hidden />
            <input
              id="recover-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="recover-password">
            Contraseña
          </label>
          <div className="auth-input-wrap">
            <Lock size={16} className="auth-input-icon" aria-hidden />
            <input
              id="recover-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="recover-backup">
            Código de respaldo
          </label>
          <motion.div className="auth-input-wrap">
            <Key size={16} className="auth-input-icon" aria-hidden />
            <input
              id="recover-backup"
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              required
              className="auth-input font-mono"
              placeholder="a1b2c3d4"
            />
          </motion.div>
        </div>
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
          {loading ? 'Verificando…' : 'Recuperar acceso'}
        </motion.button>
      </div>
    </form>
  );
}
