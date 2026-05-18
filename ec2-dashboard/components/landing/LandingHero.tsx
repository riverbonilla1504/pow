'use client';

import { motion } from 'framer-motion';
import { heroContainer } from './hero/motion';
import HeroBackdrop from './hero/HeroBackdrop';
import HeroBadge from './hero/HeroBadge';
import HeroTitle from './hero/HeroTitle';
import HeroSubtitle from './hero/HeroSubtitle';
import HeroDivider from './hero/HeroDivider';
import HeroActions from './hero/HeroActions';
import HeroStats from './hero/HeroStats';
import HeroScrollHint from './hero/HeroScrollHint';

export default function LandingHero() {
  return (
    <section
      className="hero-section relative isolate flex min-h-dvh w-full flex-col items-center overflow-hidden px-5 pt-24 pb-4 text-center sm:px-6 sm:pt-28"
      aria-labelledby="hero-heading"
    >
      <HeroBackdrop />

      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="visible"
        className="hero-stack relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-7 py-8"
      >
        <HeroBadge />
        <HeroTitle />
        <HeroSubtitle />
        <HeroDivider />
        <HeroActions />
        <HeroStats />
      </motion.div>

      <HeroScrollHint />
    </section>
  );
}
