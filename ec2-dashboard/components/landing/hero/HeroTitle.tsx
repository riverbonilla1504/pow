'use client';

import { motion } from 'framer-motion';
import { heroTitleLine } from './motion';

export default function HeroTitle() {
  return (
    <h1 id="hero-heading" className="hero-title flex flex-col items-center gap-1">
      <motion.span
        variants={heroTitleLine}
        className="hero-title__line hero-title__line--primary block text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-primary)]"
      >
        E-Commerce
      </motion.span>
      <motion.span
        variants={heroTitleLine}
        className="hero-title__line hero-title-accent block text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight"
      >
        Notificaciones
      </motion.span>
    </h1>
  );
}
