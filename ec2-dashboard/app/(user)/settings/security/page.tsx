'use client';

/**
 * SecurityPage — configuración de seguridad del usuario.
 * Permite activar/ver estado de 2FA, mostrar enrollment TOTP,
 * y gestionar la autenticación de dos factores.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TwoFactorEnroll from '@/components/auth/TwoFactorEnroll';
import { useSettingsProfile } from '@/components/settings/SettingsProfileContext';
import AccountCard from '@/components/settings/AccountCard';
import TwoFactorCard from '@/components/settings/TwoFactorCard';
import SecurityTips from '@/components/settings/SecurityTips';

export default function SecuritySettingsPage() {
  const profile = useSettingsProfile();
  const [totpEnabled, setTotpEnabled] = useState(profile.totp_enabled);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setTotpEnabled(profile.totp_enabled);
  }, [profile.totp_enabled]);

  if (enrolling) {
    return (
      <>
        <motion.header
          className="settings-hero"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button type="button" className="settings-back" onClick={() => setEnrolling(false)}>
            <ArrowLeft size={14} aria-hidden />
            Volver a seguridad
          </button>
          <h1 className="settings-hero__title">Activar 2FA</h1>
          <p className="settings-hero__desc">Sigue los pasos para vincular tu app autenticadora</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="settings-panel settings-enroll"
        >
          <TwoFactorEnroll
            onComplete={() => {
              setTotpEnabled(true);
              setEnrolling(false);
            }}
            onCancel={() => setEnrolling(false)}
          />
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.header
        className="settings-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/dashboard" className="settings-back">
          <ArrowLeft size={14} aria-hidden />
          Volver al panel
        </Link>
        <h1 className="settings-hero__title">Seguridad</h1>
        <p className="settings-hero__desc">
          Protege tu cuenta con 2FA y revisa los datos de acceso
        </p>
      </motion.header>

      <div className="settings-sections">
        <AccountCard />
        <TwoFactorCard enabled={totpEnabled} onActivate={() => setEnrolling(true)} />
        <SecurityTips />
      </div>
    </>
  );
}
