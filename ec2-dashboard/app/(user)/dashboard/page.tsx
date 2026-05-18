'use client';

/**
 * UserDashboard — panel principal del usuario.
 * Muestra: nav con perfil, stats de órdenes, tabla de mis órdenes,
 * y modal para crear nuevas órdenes. Protegido por token JWT.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { myOrders, hasToken, clearToken } from '@/lib/api';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardStats from '@/components/dashboard/DashboardStats';
import OrdersPanel, { type OrderRow } from '@/components/dashboard/OrdersPanel';
import CreateOrderModal from '@/components/dashboard/CreateOrderModal';

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    myOrders()
      .then((r: { orders?: OrderRow[] }) => setOrders(r.orders || []))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!hasToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  function logout() {
    clearToken();
    router.push('/');
  }

  const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const delivered = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="dashboard-page">
      <DashboardNav onNewOrder={() => setShowModal(true)} onLogout={logout} />

      <main className="dashboard-main">
        <motion.header
          className="dashboard-hero"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="dashboard-hero__title">Tu panel de órdenes</h1>
          <p className="dashboard-hero__desc">
            Crea pedidos, revisa el estado y recibe notificaciones automáticas por email y SMS.
          </p>
        </motion.header>

        <DashboardStats
          orderCount={orders.length}
          deliveredCount={delivered}
          totalSpent={totalSpent}
        />

        <OrdersPanel
          orders={orders}
          loading={loading}
          onCreateOrder={() => setShowModal(true)}
        />
      </main>

      <AnimatePresence>
        {showModal && (
          <CreateOrderModal onClose={() => setShowModal(false)} onCreated={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
