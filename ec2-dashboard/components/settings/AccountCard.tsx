'use client';

import { motion } from 'framer-motion';
import { User, Mail, Phone, BadgeCheck } from 'lucide-react';
import { useSettingsProfile } from '@/components/settings/SettingsProfileContext';

const ROLE_LABELS: Record<string, string> = {
  client: 'Cliente',
  cliente: 'Cliente',
  operator: 'Operador',
  operador: 'Operador',
  admin: 'Administrador',
};

export default function AccountCard() {
  const { email, phone, role } = useSettingsProfile();
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="settings-panel"
      aria-labelledby="account-heading"
    >
      <div className="settings-panel__header">
        <div className="settings-panel__icon settings-panel__icon--neutral" aria-hidden>
          <User />
        </div>
        <div className="settings-panel__heading-text">
          <h2 id="account-heading" className="settings-panel__title">
            Tu cuenta
          </h2>
          <p className="settings-panel__subtitle">Información de acceso y contacto</p>
        </div>
      </div>

      <dl className="settings-account-list">
        <div className="settings-account-list__row">
          <dt>
            <Mail aria-hidden />
            Correo
          </dt>
          <dd className="settings-account-list__value--email">{email}</dd>
        </div>
        <div className="settings-account-list__row">
          <dt>
            <Phone aria-hidden />
            Teléfono
          </dt>
          <dd className={phone ? 'settings-account-list__value--email' : 'settings-account-list__value--hint'}>
            {phone ?? 'Sin registrar. Necesario para SMS en órdenes mayores a $500.'}
          </dd>
        </div>
        <div className="settings-account-list__row">
          <dt>
            <BadgeCheck aria-hidden />
            Rol
          </dt>
          <dd>
            <span className="settings-role-badge">{roleLabel}</span>
          </dd>
        </div>
      </dl>
    </motion.section>
  );
}
