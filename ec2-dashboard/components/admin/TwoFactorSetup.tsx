'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { enroll2fa, confirm2fa, clearToken } from '@/lib/api';
import OtpInput from '@/components/auth/OtpInput';

export default function TwoFactorSetup() {
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
    } catch (e: any) {
      setError(e.message);
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
      setBackupCodes(data.backupCodes || []);
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    clearToken();
    window.location.href = 'https://freck.lat/login';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-glass rounded-2xl p-8 w-full max-w-md"
      >
        {step === 'intro' && (
          <motion.div className="text-center space-y-6">
            <div className="logo-mark w-16 h-16 rounded-2xl mx-auto">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Configurar 2FA</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                El panel de admin requiere autenticación de dos factores.
                Necesitas una app como Google Authenticator o Authy.
              </p>
            </div>
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={enroll}
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Activar 2FA
            </button>
          </motion.div>
        )}

        {step === 'scan' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white text-center">Escanea el QR</h2>
            <p className="text-xs text-slate-400 text-center">
              Abre tu app de autenticación y escanea este código
            </p>
            {qr && (
              <div className="flex justify-center">
                <img src={qr} alt="QR Code" className="rounded-xl" style={{ width: 200, height: 200 }} />
              </div>
            )}
            <div className="p-3 rounded-xl text-center card-glass">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Clave manual</p>
              <p className="text-xs font-mono text-slate-300 break-all select-all">{secret}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">
                Código de verificación
              </label>
              <OtpInput value={code} onChange={setCode} autoFocus />
            </div>
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={confirm}
              disabled={loading || code.length !== 6}
              className="btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Confirmar
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="logo-mark w-14 h-14 rounded-2xl mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">2FA Activado</h2>
              <p className="text-xs text-slate-400 mt-1">
                Guarda estos códigos de respaldo en un lugar seguro
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl card-glass">
              {backupCodes.map((c, i) => (
                <code key={i} className="text-xs font-mono text-slate-300 text-center py-1">
                  {c}
                </code>
              ))}
            </div>
            <div
              className="flex items-center gap-2 text-xs p-3 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <AlertCircle size={12} />
              Estos códigos no se mostrarán de nuevo.
            </div>
            <button type="button" onClick={finish} className="btn-primary w-full py-2.5 rounded-xl text-sm">
              Iniciar sesión con 2FA
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
