'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, KeyRound } from 'lucide-react';
import Link from 'next/link';

type TwoFactorCardProps = {
  enabled: boolean;
  onActivate: () => void;
};

export default function TwoFactorCard({ enabled, onActivate }: TwoFactorCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="settings-panel"
      aria-labelledby="twofa-heading"
    >
      <div className="settings-panel__body-row">
        <div className="settings-panel__header settings-panel__header--inline">
          <div
            className={`settings-panel__icon${enabled ? ' settings-panel__icon--success' : ' settings-panel__icon--neutral'}`}
            aria-hidden
          >
            {enabled ? <ShieldCheck style={{ color: 'var(--green)' }} /> : <Shield />}
          </div>
          <div className="settings-panel__copy">
            <h2 id="twofa-heading" className="settings-panel__title">
              Autenticación de dos factores (2FA)
            </h2>
            <p className="settings-panel__desc">
              {enabled
                ? 'Tu cuenta está protegida. Al iniciar sesión se pedirá un código de tu app autenticadora.'
                : 'Añade una capa extra con Google Authenticator, Authy u otra app compatible con TOTP.'}
            </p>
            {enabled ? (
              <span className="settings-status-badge settings-status-badge--on">
                <ShieldCheck aria-hidden />
                Activo
              </span>
            ) : (
              <span className="settings-status-badge settings-status-badge--off">Desactivado</span>
            )}
          </div>
        </div>

        {!enabled && (
          <motion.button
            type="button"
            onClick={onActivate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary settings-panel__cta"
          >
            Activar 2FA
          </motion.button>
        )}
      </div>

      <div className="settings-panel__footer-hint">
        <KeyRound aria-hidden />
        <p>
          ¿Perdiste el acceso? Usa un{' '}
          <Link href="/login/recover" className="settings-link">
            código de respaldo
          </Link>{' '}
          en la pantalla de inicio de sesión.
        </p>
      </div>
    </motion.section>
  );
}
