'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useMediaQuery } from './useMediaQuery';

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#tecnologias', label: 'Tecnologías' },
];

const ICON = { size: 14, strokeWidth: 2 } as const;
const LOGO_BOX = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0';
const MOBILE_MQ = '(max-width: 767px)';

function MenuIcon({ open }: { open: boolean }) {
  const bar = 'absolute left-0 right-0 h-[1.5px] rounded-full bg-current';
  return (
    <span className="relative block h-3.5 w-[18px]" aria-hidden>
      <motion.span
        className={`${bar} top-0`}
        animate={open ? { top: '50%', y: '-50%', rotate: 45 } : { top: 0, y: 0, rotate: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className={`${bar} top-1/2 -translate-y-1/2`}
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className={`${bar} bottom-0`}
        animate={open ? { bottom: '50%', y: '50%', rotate: -45 } : { bottom: 0, y: 0, rotate: 0 }}
        transition={{ duration: 0.2 }}
      />
    </span>
  );
}

function BrandMark() {
  return (
    <div className={`logo-mark ${LOGO_BOX}`}>
      <ShoppingBag {...ICON} />
    </div>
  );
}

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery(MOBILE_MQ);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobile && mobileOpen) setMobileOpen(false);
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const showMobileChrome = mounted && isMobile;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className={`landing-header-shell fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5 pointer-events-none sm:px-5 ${scrolled ? 'landing-header-shell--scrolled' : ''}`}
      >
        <motion.nav
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className={`header-glass pointer-events-auto flex w-full max-w-4xl items-center gap-3 rounded-2xl border px-3.5 py-2 min-h-[3.25rem] backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-2.5 ${scrolled ? 'header-glass--scrolled' : ''}`}
        >
          <Link href="/" className="header-brand group">
            <BrandMark />
            <span className="font-medium text-sm tracking-tight truncate theme-brand-name">
              freck.lat
            </span>
          </Link>

          <nav className="header-nav hidden flex-1 items-center justify-center gap-0.5 md:flex" aria-label="Secciones">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="header-nav-link">
                {label}
              </a>
            ))}
          </nav>

          <div className="header-actions hidden items-center gap-2 md:flex md:border-l md:border-[var(--border)] md:pl-3.5">
            <ThemeToggle size="sm" />
            <Link href="/login" className="btn-header-ghost">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-header-primary">
              Empezar
              <ArrowRight {...ICON} />
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {showMobileChrome && !mobileOpen && (
              <motion.div
                key="mobile-actions"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="header-mobile-actions ml-auto flex items-center gap-2 md:hidden"
              >
                <ThemeToggle size="sm" />
                <Link href="/login" className="btn-header-menu-text">
                  Iniciar sesión
                </Link>
                <button
                  type="button"
                  aria-expanded={false}
                  aria-label="Abrir menú"
                  onClick={() => setMobileOpen(true)}
                  className="btn-header-menu"
                >
                  <MenuIcon open={false} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </motion.header>

      <AnimatePresence>
        {showMobileChrome && mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 backdrop-blur-sm theme-overlay"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[min(100%,17.5rem)] flex flex-col mobile-drawer rounded-l-xl"
            >
              <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-divider shrink-0">
                <span className="text-sm font-medium theme-fg-secondary">Menú</span>
                <ThemeToggle size="sm" />
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                  className="btn-header-menu btn-header-menu--open"
                >
                  <X {...ICON} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
                {NAV_LINKS.map(({ href, label }, i) => (
                  <motion.a
                    key={href}
                    href={href}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.04 }}
                    onClick={() => setMobileOpen(false)}
                    className="mobile-nav-item"
                  >
                    {label}
                  </motion.a>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="shrink-0 p-3 border-t border-white/[0.06] mobile-menu-actions"
              >
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-mobile-outline">
                  Iniciar sesión
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-mobile-fill">
                  Empezar
                </Link>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
