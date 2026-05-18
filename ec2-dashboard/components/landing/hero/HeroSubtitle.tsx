'use client';

import { motion } from 'framer-motion';
import { heroItem } from './motion';

const TECH_STACK = [
  { label: 'Email', detail: 'AWS SES', accent: true },
  { label: 'SMS', detail: 'Twilio', accent: false },
  { label: 'Colas', detail: 'RabbitMQ', accent: false },
] as const;

export default function HeroSubtitle() {
  return (
    <motion.div variants={heroItem} className="hero-subtitle-wrap mx-auto flex max-w-2xl flex-col items-center gap-5">
      <p className="hero-subtitle">
        <span className="hero-subtitle__lead">
          Plataforma de notificaciones en tiempo real para órdenes de e-commerce.
        </span>
      </p>
      <ul className="hero-subtitle__stack m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0" aria-label="Stack tecnológico">
        {TECH_STACK.map(({ label, detail, accent }) => (
          <li key={label}>
            <span className={accent ? 'hero-tech-chip hero-tech-chip--accent' : 'hero-tech-chip'}>
              <span className="hero-tech-chip__label">{label}</span>
              <span className="hero-tech-chip__sep" aria-hidden>·</span>
              <span className="hero-tech-chip__detail">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
