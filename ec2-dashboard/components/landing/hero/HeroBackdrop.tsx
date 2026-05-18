'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const HeroThreeScene = dynamic(() => import('./HeroThreeScene'), {
  ssr: false,
  loading: () => <motion.div className="hero-three-canvas hero-three-canvas--loading" aria-hidden />,
});

export default function HeroBackdrop() {
  return (
    <motion.div
      className="hero-backdrop"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <HeroThreeScene />
      <div className="hero-backdrop__vignette" />
      <div className="hero-grid" />
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="hero-backdrop__shape hero-backdrop__shape--square hidden lg:block"
      />
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="hero-backdrop__shape hero-backdrop__shape--ring hidden lg:block"
      />
    </motion.div>
  );
}
