'use client';

import { motion } from 'framer-motion';
import { heroItem } from './motion';

export default function HeroDivider() {
  return (
    <motion.div variants={heroItem} className="hero-section-divider" role="presentation" aria-hidden />
  );
}
