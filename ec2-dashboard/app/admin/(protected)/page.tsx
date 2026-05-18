'use client';

/**
 * AdminDashboard — página principal del panel de administración.
 * Muestra: stat cards (órdenes, revenue, usuarios, notificaciones),
 * gráfica de barras (órdenes por estado), gráfica de pie (notificaciones),
 * y tabla de las últimas 10 órdenes.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, DollarSign, Mail, MessageSquare, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminDashboard } from '@/lib/api';
import StatusBadge from '@/components/shared/StatusBadge';
import { useTheme } from '@/components/theme/ThemeProvider';
import { getChartTheme, ORDER_STATUS_COLORS } from '@/lib/chart-theme';

/** Card individual de estadística con icono, valor y color temático */
function StatCard({ title, value, icon: Icon, color, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -3 }}
      className="dashboard-stat glass"
      style={{ borderColor: `color-mix(in srgb, ${color} 22%, var(--border))` }}
    >
      <div
        className="dashboard-stat__icon"
        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="dashboard-stat__label uppercase tracking-widest">{title}</p>
        <p className="dashboard-stat__value" style={{ color, fontSize: '1.5rem' }}>{value}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const chart = getChartTheme(theme);
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalOrders = data?.ordersByStatus?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const totalUsers  = data?.usersByRole?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const emailSent   = parseInt(data?.notificationStats?.find((n: any) => n.type === 'email' && n.status === 'sent')?.count || 0);
  const smsSent     = parseInt(data?.notificationStats?.find((n: any) => n.type === 'sms'   && n.status === 'sent')?.count || 0);

  const orderChartData = data?.ordersByStatus?.map((r: any) => ({ name: r.status, total: parseInt(r.count) })) || [];
  const notifData      = [{ name: 'Email', value: emailSent }, { name: 'SMS', value: smsSent }];

  if (loading) return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 skeleton" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">admin.freck.lat · ECommerce Notification System</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Órdenes"       value={totalOrders}                        icon={ShoppingCart}  color={chart.brand}  delay={0}    />
        <StatCard title="Revenue"       value={`$${(data?.totalRevenue || 0).toFixed(0)}`} icon={DollarSign}    color="#3b82f6"     delay={0.06} />
        <StatCard title="Usuarios"      value={totalUsers}                         icon={Users}         color="#8b5cf6"     delay={0.12} />
        <StatCard title="Notificaciones" value={emailSent + smsSent}               icon={TrendingUp}    color="#f59e0b"     delay={0.18} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="dashboard-panel glass p-5"
        >
          <h2 className="admin-section-title mb-5">Órdenes por Estado</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={orderChartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: chart.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chart.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {orderChartData.map((e: any) => <Cell key={e.name} fill={ORDER_STATUS_COLORS[e.name] || chart.brand} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="dashboard-panel glass p-5"
        >
          <h2 className="admin-section-title mb-5">Notificaciones Enviadas</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={notifData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                <Cell fill="#3b82f6" /><Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip contentStyle={chart.tooltip} />
              <Legend formatter={(v) => <span style={{ color: chart.textMuted, fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="dashboard-panel glass overflow-hidden"
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="admin-section-title">Últimas Órdenes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="admin-thead">
              <tr>
                {['ID', 'Usuario', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="admin-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map((o: any, i: number) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.03 }}
                  className="admin-row"
                >
                  <td className="admin-td admin-td--mono">{o.id.slice(0, 8)}…</td>
                  <td className="admin-td">{o.user_email}</td>
                  <td className="admin-td admin-td--accent">${parseFloat(o.total).toFixed(2)}</td>
                  <td className="admin-td"><StatusBadge value={o.status} /></td>
                  <td className="admin-td admin-td--muted">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
