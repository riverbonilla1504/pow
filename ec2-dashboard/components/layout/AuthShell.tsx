'use client';

/**
 * AuthShell — layout compartido para páginas de login y registro.
 * Layout split: panel izquierdo con branding/promo, panel derecho con formulario.
 * Incluye navegación entre login/registro y toggle de tema.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const PROMO = {
  user: {
    title: 'Del pedido a la notificación en segundos',
    body: 'Email con AWS SES, SMS con Twilio y colas RabbitMQ con DLQ — todo orquestado para tu e-commerce.',
    cta: { href: '/#como-funciona', label: 'Ver cómo funciona' },
  },
  admin: {
    title: 'Panel de control del sistema',
    body: 'Gestiona órdenes, usuarios, notificaciones y la cola de mensajes fallidos desde un solo lugar.',
    cta: { href: '/admin', label: 'Ir al dashboard' },
  },
} as const;

export interface AuthShellProps {
  children: React.ReactNode;
  variant?: 'user' | 'admin';
  heading: string;
  hint?: React.ReactNode;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  promoTitle?: string;
  promoBody?: string;
  promoCta?: { href: string; label: string };
}

export default function AuthShell({
  children,
  variant = 'user',
  heading,
  hint,
  subtitle,
  backHref,
  backLabel,
  promoTitle,
  promoBody,
  promoCta,
}: AuthShellProps) {
  const isAdmin = variant === 'admin';
  const Icon = isAdmin ? Zap : ShoppingBag;
  const brand = isAdmin ? 'admin.freck.lat' : 'freck.lat';
  const promo = PROMO[variant];
  const title = promoTitle ?? promo.title;
  const body = promoBody ?? promo.body;
  const cta = promoCta ?? promo.cta;

  return (
    <motion.div
      className="auth-split"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-split__panel">
        <motion.div
          className="auth-split__panel-inner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-split__top">
            {backHref ? (
              <Link href={backHref} className="auth-back-link">
                <ArrowLeft size={14} aria-hidden />
                {backLabel || 'Volver'}
              </Link>
            ) : (
              <span aria-hidden />
            )}
            <ThemeToggle size="sm" />
          </div>

          <div className="auth-split__brand">
            <div className="logo-mark auth-split__logo">
              <Icon size={20} strokeWidth={2} />
            </div>
            <motion.div>
              <p className="auth-split__brand-name">{brand}</p>
              {subtitle && <p className="auth-split__brand-sub">{subtitle}</p>}
            </motion.div>
          </div>

          <header className="auth-split__intro">
            <h1 className="auth-split__heading">{heading}</h1>
            {hint && <p className="auth-split__hint">{hint}</p>}
          </header>

          <div className="auth-split__form-wrap">{children}</div>
        </motion.div>
      </div>

      <aside className="auth-split__aside">
        <div className="auth-split__aside-bg" aria-hidden />
        <span className="auth-split__deco auth-split__deco--braces" aria-hidden>
          {'{}'}
        </span>
        <span className="auth-split__deco auth-split__deco--star" aria-hidden>
          {'*/'}
        </span>
        <motion.div
          className="auth-split__promo"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h2 className="auth-split__promo-title">{title}</h2>
          <p className="auth-split__promo-body">{body}</p>
          <Link href={cta.href} className="auth-split__promo-cta">
            {cta.label}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </motion.div>
      </aside>
    </motion.div>
  );
}
