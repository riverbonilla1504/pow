'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { heroItem } from './motion';

export default function HeroBadge() {
  return (
    <motion.div variants={heroItem} className="flex justify-center">
      <motion.span
        whileHover={{ scale: 1.03 }}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-medium header-glass hero-badge"
      >
        <motion.span
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full shrink-0 hero-badge__dot"
        />
        <Sparkles size={14} className="opacity-90" />
        Sistema de Notificaciones Activo
      </motion.span>
    </motion.div>
  );
}
