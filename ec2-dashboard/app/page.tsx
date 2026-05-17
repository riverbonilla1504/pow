'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, DollarSign, Mail, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AuthGuard from '../components/AuthGuard';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', paid: '#3b82f6', shipped: '#a855f7',
  delivered: '#22c55e', returned: '#ef4444',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalOrders = data?.ordersByStatus?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const totalUsers = data?.usersByRole?.reduce((a: number, r: any) => a + parseInt(r.count), 0) || 0;
  const emailSent = data?.notificationStats?.find((n: any) => n.type === 'email' && n.status === 'sent')?.count || 0;
  const smsSent = data?.notificationStats?.find((n: any) => n.type === 'sms' && n.status === 'sent')?.count || 0;

  const orderChartData = data?.ordersByStatus?.map((r: any) => ({
    name: r.status, count: parseInt(r.count),
  })) || [];

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">ECommerce Notification System — freck.lat</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Orders" value={totalOrders} icon={ShoppingCart} color="blue" delay={0} />
              <MetricCard title="Revenue" value={`$${data?.totalRevenue?.toFixed(2) || '0.00'}`} icon={DollarSign} color="green" delay={0.05} />
              <MetricCard title="Users" value={totalUsers} icon={Users} color="purple" delay={0.1} />
              <MetricCard title="Emails Sent" value={emailSent} icon={Mail} color="yellow" delay={0.15} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="SMS Sent" value={smsSent} icon={MessageSquare} color="purple" delay={0.2} />
              <MetricCard title="Notifications" value={parseInt(emailSent) + parseInt(smsSent)} icon={TrendingUp} color="green" delay={0.25} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders by status bar chart */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="glass rounded-xl p-5 border border-white/5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Orders by Status</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={orderChartData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {orderChartData.map((entry: any) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#4f7ef8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Notifications pie */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="glass rounded-xl p-5 border border-white/5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Notifications</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[{ name: 'Email', value: parseInt(emailSent) || 0 }, { name: 'SMS', value: parseInt(smsSent) || 0 }]}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#a855f7" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-blue-500" />Email ({emailSent})</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-purple-500" />SMS ({smsSent})</div>
                </div>
              </motion.div>
            </div>

            {/* Recent orders */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass rounded-xl border border-white/5">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-slate-300">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Order ID</th>
                      <th className="px-5 py-3 text-left">User</th>
                      <th className="px-5 py-3 text-left">Total</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentOrders?.map((order: any, i: number) => (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.03 }}
                        className="border-t border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{order.id.slice(0, 8)}…</td>
                        <td className="px-5 py-3 text-slate-300">{order.user_email}</td>
                        <td className="px-5 py-3 text-green-400 font-medium">${parseFloat(order.total).toFixed(2)}</td>
                        <td className="px-5 py-3"><StatusBadge value={order.status} /></td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
