'use client';

import { motion } from 'framer-motion';
import { Package, CheckCircle2, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Stat = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: 'green' | 'emerald' | 'blue';
};

type DashboardStatsProps = {
  orderCount: number;
  deliveredCount: number;
  totalSpent: number;
};

export default function DashboardStats({ orderCount, deliveredCount, totalSpent }: DashboardStatsProps) {
  const stats: Stat[] = [
    { label: 'Total órdenes', value: orderCount, icon: Package, accent: 'green' },
    { label: 'Entregadas', value: deliveredCount, icon: CheckCircle2, accent: 'emerald' },
    { label: 'Total gastado', value: `$${totalSpent.toFixed(2)}`, icon: Wallet, accent: 'blue' },
  ];

  return (
    <div className="dashboard-stats">
      {stats.map(({ label, value, icon: Icon, accent }, i) => (
        <motion.article
          key={label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          whileHover={{ y: -3 }}
          className={`dashboard-stat glass dashboard-stat--${accent}`}
        >
          <div className={`dashboard-stat__icon dashboard-stat__icon--${accent}`}>
            <Icon size={18} strokeWidth={2} aria-hidden />
          </div>
          <div className="dashboard-stat__body">
            <p className="dashboard-stat__label">{label}</p>
            <p className="dashboard-stat__value">{value}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
