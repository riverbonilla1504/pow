'use client';

/**
 * OrdersPanel — tabla de órdenes del usuario con iconos de estado,
 * animación de entrada escalonada, y estado vacío.
 */

import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  paid: CheckCircle,
  shipped: Truck,
  delivered: CheckCircle,
  returned: RotateCcw,
};

export type OrderRow = {
  id: string;
  total: string;
  status: string;
  created_at: string;
};

type OrdersPanelProps = {
  orders: OrderRow[];
  loading: boolean;
  onCreateOrder: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPanel({ orders, loading, onCreateOrder }: OrdersPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      className="dashboard-panel glass"
      aria-labelledby="orders-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <h2 id="orders-heading" className="dashboard-panel__title">
            Mis órdenes
          </h2>
          <p className="dashboard-panel__subtitle">
            {loading ? 'Cargando…' : `${orders.length} ${orders.length === 1 ? 'orden' : 'órdenes'}`}
          </p>
        </div>
        <button type="button" onClick={onCreateOrder} className="dashboard-panel__header-btn btn-ghost">
          <Plus size={14} aria-hidden />
          Nueva
        </button>
      </div>

      {loading ? (
        <div className="dashboard-panel__skeletons">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-order-skeleton skeleton" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty__icon callout-green">
            <Package size={26} style={{ color: 'var(--green)' }} aria-hidden />
          </div>
          <h3 className="dashboard-empty__title">Aún no tienes órdenes</h3>
          <p className="dashboard-empty__desc">
            Crea tu primera orden y recibirás notificaciones por email (y SMS si supera $500).
          </p>
          <button type="button" onClick={onCreateOrder} className="btn-primary dashboard-empty__cta">
            <Plus size={16} aria-hidden />
            Crear primera orden
          </button>
        </div>
      ) : (
        <ul className="dashboard-orders">
          {orders.map((order, i) => {
            const Icon = STATUS_ICONS[order.status] || Package;
            return (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="dashboard-order"
              >
                <div className="dashboard-order__main">
                  <div className="dashboard-order__icon-wrap">
                    <Icon size={16} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="dashboard-order__info">
                    <p className="dashboard-order__id">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="dashboard-order__date">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <motion.div className="dashboard-order__meta">
                  <p className="dashboard-order__total">${parseFloat(order.total).toFixed(2)}</p>
                  <StatusBadge value={order.status} />
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
