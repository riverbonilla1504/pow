'use client';

import { motion } from 'framer-motion';
import { Lock, Smartphone, MessageSquare } from 'lucide-react';

const TIPS = [
  {
    icon: Lock,
    title: 'Contraseña única',
    desc: 'No reutilices la misma contraseña en otros sitios.',
  },
  {
    icon: Smartphone,
    title: 'App autenticadora',
    desc: 'Guarda los códigos de respaldo en un lugar seguro fuera del teléfono.',
  },
  {
    icon: MessageSquare,
    title: 'SMS en pedidos grandes',
    desc: 'Las órdenes mayores a $500 envían alerta al teléfono registrado.',
  },
] as const;

export default function SecurityTips() {
  return (
    <section className="settings-tips" aria-labelledby="tips-heading">
      <h2 id="tips-heading" className="settings-tips__heading">
        Buenas prácticas
      </h2>
      <ul className="settings-tips__grid">
        {TIPS.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="settings-tip">
            <div className="settings-tip__icon" aria-hidden>
              <Icon />
            </div>
            <div className="settings-tip__body">
              <h3 className="settings-tip__title">{title}</h3>
              <p className="settings-tip__desc">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
