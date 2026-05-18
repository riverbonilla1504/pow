'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, Zap, Shield, GitBranch, Package } from 'lucide-react';

type FeatureAccent = 'blue' | 'violet' | 'yellow' | 'emerald' | 'pink' | 'orange';

const features: {
  icon: typeof Mail;
  title: string;
  desc: string;
  accent: FeatureAccent;
}[] = [
  { icon: Mail, title: 'Notificaciones por email', desc: 'Correos automáticos con AWS SES en cada evento de orden: confirmada, enviada o devuelta.', accent: 'blue' },
  { icon: MessageSquare, title: 'Alertas SMS', desc: 'Órdenes de alto valor (+$500) envían SMS instantáneo vía Twilio al teléfono del cliente.', accent: 'violet' },
  { icon: Zap, title: 'Cola RabbitMQ', desc: 'Arquitectura orientada a eventos con exchanges por tema, DLQ y mensajes persistentes.', accent: 'yellow' },
  { icon: Shield, title: 'Auth JWT + 2FA', desc: 'Tokens RS256 con autenticación TOTP opcional en rutas de administración.', accent: 'emerald' },
  { icon: GitBranch, title: 'Acceso por roles', desc: 'Tres roles — cliente, operador y admin — cada uno con permisos granulares.', accent: 'pink' },
  { icon: Package, title: 'Dead Letter Queue', desc: 'Tras 3 reintentos, las notificaciones fallidas van a la DLQ para revisión manual.', accent: 'orange' },
];

export default function TechnologiesSection() {
  return (
    <section id="tecnologias" className="landing-section landing-section--wide">
      <header className="landing-section__header">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-section__title"
        >
          Tecnologías
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="landing-section__desc"
        >
          Stack completo de producción
        </motion.p>
      </header>

      <div className="feature-grid">
        {features.map(({ icon: Icon, title, desc, accent }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className={`feature-card feature-card--${accent}`}
          >
            <div className="feature-card__icon">
              <Icon size={22} />
            </div>
            <div className="feature-card__body">
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{desc}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
