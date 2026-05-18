'use client';

import { motion } from 'framer-motion';

export default function HeroScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="hero-scroll-footer relative z-10 mt-auto flex w-full flex-col items-center justify-center gap-2 pb-2"
      aria-hidden
    >
      <span className="hero-scroll-hint__label text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Bajar
      </span>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center"
      >
        <div className="hero-scroll-track flex h-9 w-[1.35rem] justify-center rounded-full border border-[var(--border-strong)] pt-1.5">
          <span className="hero-scroll-thumb block h-[0.45rem] w-1 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
