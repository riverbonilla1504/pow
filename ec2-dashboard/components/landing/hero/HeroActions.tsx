'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { heroItem } from './motion';

export default function HeroActions() {
  return (
    <motion.div variants={heroItem} className="hero-cta-block flex w-full flex-col items-center gap-4">
      <p className="hero-cta-eyebrow m-0 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Empieza en minutos
      </p>
      <div className="hero-cta-row flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
        <Link href="/register" className="btn-hero-primary">
          Crear Cuenta
          <ArrowRight size={18} className="btn-hero-icon" aria-hidden />
        </Link>
        <Link href="/login" className="btn-hero-ghost">
          Iniciar Sesión
        </Link>
      </div>
    </motion.div>
  );
}
