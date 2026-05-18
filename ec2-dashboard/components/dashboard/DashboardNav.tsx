'use client';

/**
 * DashboardNav — barra de navegación superior del dashboard de usuario.
 * Incluye: logo, links de navegación, toggle de tema, botón admin (si aplica), y logout.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, LogOut, Shield } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

type DashboardNavProps = {
  variant?: 'dashboard' | 'settings';
  onNewOrder?: () => void;
  onLogout: () => void;
};

export default function DashboardNav({ variant = 'dashboard', onNewOrder, onLogout }: DashboardNavProps) {
  const pathname = usePathname();
  const onSettings = variant === 'settings' || pathname.startsWith('/settings');
  return (
    <header className="dashboard-nav-wrap">
      <nav className="dashboard-nav">
        <Link href="/" className="dashboard-nav__brand">
          <div className="logo-mark dashboard-nav__logo">
            <ShoppingBag size={15} strokeWidth={2} />
          </div>
          <span className="dashboard-nav__brand-name">freck.lat</span>
        </Link>

        <div className="dashboard-nav__actions">
          <ThemeToggle size="sm" />
          {variant === 'dashboard' && onNewOrder && (
            <motion.button
              type="button"
              onClick={onNewOrder}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary dashboard-nav__cta"
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden />
              <span className="dashboard-nav__cta-label">Nueva orden</span>
            </motion.button>
          )}
          <Link
            href="/settings/security"
            className={`dashboard-nav__icon-btn${onSettings ? ' dashboard-nav__icon-btn--active' : ''}`}
            aria-label="Seguridad"
            title="Seguridad"
            aria-current={onSettings ? 'page' : undefined}
          >
            <Shield size={16} strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="dashboard-nav__icon-btn"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </nav>
    </header>
  );
}
