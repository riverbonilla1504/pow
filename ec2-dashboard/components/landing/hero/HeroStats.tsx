'use client';

import { motion } from 'framer-motion';
import { heroItem } from './motion';

const STATS = [
  { val: '5', label: 'Instancias EC2' },
  { val: '3', label: 'Microservicios' },
  { val: '2FA', label: 'Autenticación' },
  { val: 'TLS 1.3', label: 'Seguridad' },
] as const;

export default function HeroStats() {
  return (
    <motion.div
      variants={heroItem}
      className="hero-stats mt-2 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-6 border-t border-[var(--border)] pt-8 sm:gap-x-12 sm:pt-10"
    >
      {STATS.map(({ val, label }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
          whileHover={{ y: -4 }}
          className="min-w-[5.5rem] text-center"
        >
          <p className="hero-stat-value m-0 text-2xl font-black sm:text-3xl">{val}</p>
          <p className="mt-1.5 text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
