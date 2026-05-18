'use client';

/**
 * LandingPage — página principal de freck.lat.
 * Compuesta por secciones: header, hero con escena 3D, cómo funciona,
 * tecnologías usadas, y CTA final. Accesible sin autenticación.
 */

import { motion } from 'framer-motion';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TechnologiesSection from '@/components/landing/TechnologiesSection';
import LandingCtaSection from '@/components/landing/LandingCtaSection';

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="landing-page"
    >
      <LandingHeader />
      <LandingHero />
      <HowItWorksSection />
      <TechnologiesSection />
      <LandingCtaSection />

      <footer className="landing-footer">
        <p className="landing-footer__text">
          freck.lat · Sistema de notificaciones e-commerce · Grupo 2
        </p>
      </footer>
    </motion.div>
  );
}
