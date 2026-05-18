'use client';

/**
 * TwoFactorEnroll — flujo completo de activación de 2FA.
 * Paso 1: genera secreto TOTP y muestra QR code.
 * Paso 2: usuario ingresa código de su app para confirmar.
 * Paso 3: muestra códigos de respaldo y completa el enrollment.
 */

import { useState } from 'react';
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { enroll2fa, confirm2fa } from '@/lib/api';
import OtpInput from '@/components/auth/OtpInput';

interface TwoFactorEnrollProps {
  onComplete: (backupCodes: string[]) => void;
  onCancel?: () => void;
}

export default function TwoFactorEnroll({ onComplete, onCancel }: TwoFactorEnrollProps) {
  const [step, setStep] = useState<'intro' | 'scan' | 'done'>('intro');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function enroll() {
    setLoading(true);
    setError('');
    try {
      const data = await enroll2fa();
      setQr(data.qrCode);
      setSecret(data.secret);
      setStep('scan');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al activar 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (code.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await confirm2fa(code);
      const codes = data.backupCodes || [];
      setBackupCodes(codes);
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="settings-enroll__steps">
        <div className="settings-enroll__head settings-enroll__head--center">
          <div className="settings-enroll__icon settings-enroll__icon--success">
            <CheckCircle size={24} aria-hidden />
          </div>
          <h2 className="settings-enroll__title">2FA activado</h2>
          <p className="settings-enroll__subtitle">Guarda estos códigos de respaldo en un lugar seguro</p>
        </div>
        <div className="settings-enroll__codes">
          {backupCodes.map((c, i) => (
            <code key={i}>{c}</code>
          ))}
        </div>
        <div className="settings-enroll__warn" role="note">
          <AlertCircle size={14} aria-hidden />
          Estos códigos no se mostrarán de nuevo.
        </div>
        <button type="button" onClick={() => onComplete(backupCodes)} className="btn-primary auth-submit">
          Continuar
        </button>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="settings-enroll__steps">
        <div className="settings-enroll__head settings-enroll__head--center">
          <h2 className="settings-enroll__title">Escanea el QR</h2>
          <p className="settings-enroll__subtitle">Abre tu app de autenticación y escanea este código</p>
        </div>
        {qr ? (
          <div className="settings-enroll__qr-wrap">
            <img src={qr} alt="Código QR para 2FA" width={200} height={200} className="settings-enroll__qr" />
          </div>
        ) : null}
        <div className="settings-enroll__secret card-glass">
          <p className="settings-enroll__secret-label">Clave manual</p>
          <p className="settings-enroll__secret-value">{secret}</p>
        </div>
        <div className="auth-field w-full">
          <label
            className="mb-2 block text-center text-sm font-medium text-[var(--text-primary)]"
            htmlFor="totp-code"
          >
            Código de verificación
          </label>
          <OtpInput id="totp-code" value={code} onChange={setCode} autoFocus />
        </div>
        {error ? (
          <div className="auth-alert" role="alert">
            <AlertCircle size={14} className="shrink-0" aria-hidden />
            {error}
          </div>
        ) : null}
        <div className="settings-enroll__actions">
          {onCancel ? (
            <button type="button" onClick={onCancel} className="settings-enroll__btn-secondary">
              Cancelar
            </button>
          ) : null}
          <button
            type="button"
            onClick={confirm}
            disabled={loading || code.length !== 6}
            className={`btn-primary auth-submit${onCancel ? ' settings-enroll__btn-grow' : ''}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <CheckCircle size={16} aria-hidden />}
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-enroll__steps settings-enroll__steps--intro">
      <div className="settings-enroll__icon">
        <Shield size={28} aria-hidden />
      </div>
      <div className="settings-enroll__head settings-enroll__head--center">
        <h2 className="settings-enroll__title">Configurar 2FA</h2>
        <p className="settings-enroll__subtitle">
          Necesitas una app como Google Authenticator o Authy para generar códigos de verificación.
        </p>
      </div>
      {error ? (
        <div className="auth-alert" role="alert">
          <AlertCircle size={14} className="shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}
      <div className="settings-enroll__actions">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="settings-enroll__btn-secondary">
            Cancelar
          </button>
        ) : null}
        <button
          type="button"
          onClick={enroll}
          disabled={loading}
          className={`btn-primary auth-submit${onCancel ? ' settings-enroll__btn-grow' : ''}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Shield size={16} aria-hidden />}
          Activar 2FA
        </button>
      </div>
    </div>
  );
}
