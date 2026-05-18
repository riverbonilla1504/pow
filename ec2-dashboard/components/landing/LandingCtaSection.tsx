'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingCtaSection() {
  return (
    <section className="landing-cta-section">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="landing-cta-card glass glow-green"
      >
        <h2 className="landing-cta-card__title">¿Listo para empezar?</h2>
        <p className="landing-cta-card__desc">
          Crea tu cuenta y haz tu primera orden. Las notificaciones llegan automáticamente.
        </p>
        <div className="landing-cta-card__action">
          <Link href="/register" className="btn-hero-primary">
            Crear Cuenta Gratis
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
