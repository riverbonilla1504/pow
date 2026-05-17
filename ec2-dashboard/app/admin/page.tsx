'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, DollarSign, Mail, MessageSquare, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminDashboard } from '@/lib/api';
import StatusBadge from '@/components/shared/StatusBadge';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', paid: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', returned: '#ef4444',
};

function Card({ title, value, icon: Icon, color, delay = 0 }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -3 }} className="glass rounded-2xl p-5" style={{ border: `1px solid ${color}25` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

const tooltipStyle = { background: '#0f1020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0', fontSize: '12px' };

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalOrders = data?.ordersByStatus?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const totalUsers = data?.usersByRole?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const emailSent = parseInt(data?.notificationStats?.find((n: any) => n.type === 'email' && n.status === 'sent')?.count || 0);
  const smsSent = parseInt(data?.notificationStats?.find((n: any) => n.type === 'sms' && n.status === 'sent')?.count || 0);

  const orderChartData = data?.ordersByStatus?.map((r: any) => ({ name: r.status, total: parseInt(r.count) })) || [];
  const notifData = [{ name: 'Email', value: emailSent }, { name: 'SMS', value: smsSent }];

  if (loading) return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 skeleton" />)}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">admin.freck.lat · ECommerce Notification System</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Órdenes" value={totalOrders} icon={ShoppingCart} color="#00ed64" delay={0} />
        <Card title="Revenue" value={`$${(data?.totalRevenue || 0).toFixed(0)}`} icon={DollarSign} color="#3b82f6" delay={0.06} />
        <Card title="Usuarios" value={totalUsers} icon={Users} color="#8b5cf6" delay={0.12} />
        <Card title="Notificaciones" value={emailSent + smsSent} icon={TrendingUp} color="#f59e0b" delay={0.18} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-5">Órdenes por Estado</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={orderChartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {orderChartData.map((e: any) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#00ed64'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-5">Notificaciones Enviadas</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={notifData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                <Cell fill="#3b82f6" /><Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-slate-300">Últimas Órdenes</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] text-slate-600 uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)' }}>
            {['ID', 'Usuario', 'Total', 'Estado', 'Fecha'].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}
          </tr></thead>
          <tbody>
            {data?.recentOrders?.map((o: any, i: number) => (
              <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.03 }}
                className="hover:bg-white/2 transition-colors" style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{o.id.slice(0, 8)}…</td>
                <td className="px-5 py-3 text-slate-300 text-xs">{o.user_email}</td>
                <td className="px-5 py-3 text-xs font-semibold" style={{ color: 'var(--green)' }}>${parseFloat(o.total).toFixed(2)}</td>
                <td className="px-5 py-3"><StatusBadge value={o.status} /></td>
                <td className="px-5 py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
