'use client';

import { motion } from 'framer-motion';

const STEPS = [
  { step: '01', title: 'Crear orden', desc: 'El cliente crea la orden vía API REST' },
  { step: '02', title: 'Evento publicado', desc: 'La API publica al exchange de RabbitMQ' },
  { step: '03', title: 'Workers procesan', desc: 'Los workers de email y SMS consumen la cola' },
  { step: '04', title: 'Cliente notificado', desc: 'El cliente recibe email y SMS' },
] as const;

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="landing-section landing-section--narrow">
      <header className="landing-section__header">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-section__title"
        >
          Cómo Funciona
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="landing-section__desc"
        >
          Del pedido a la notificación en milisegundos
        </motion.p>
      </header>

      <ol className="flow-grid">
        <motion.div
          aria-hidden
          className="flow-grid__line"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
        {STEPS.map(({ step, title, desc }, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flow-step"
          >
            <div className="flow-step__badge">{step}</div>
            <h3 className="flow-step__title">{title}</h3>
            <p className="flow-step__desc">{desc}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
