'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import AuthGuard from '../../components/AuthGuard';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../lib/api';

const STATUSES = ['', 'pending', 'paid', 'shipped', 'delivered', 'returned'];

export default function OrdersPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.orders(page, status || undefined).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page, status]);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <p className="text-slate-400 text-sm mt-1">{data?.total || 0} total orders</p>
          </div>
          <div className="flex items-center gap-2">
            {STATUSES.map(s => (
              <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Order ID</th>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Total</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Items</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-5 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : data?.orders?.map((order: any, i: number) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{order.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{order.user_email}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{order.user_phone || '—'}</td>
                    <td className="px-5 py-3 text-green-400 font-medium">${parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-5 py-3"><StatusBadge value={order.status} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{order.items?.length || 0} item(s)</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-xs text-slate-500">Page {page} of {data?.pages || 1}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 disabled:opacity-30 hover:text-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))} disabled={page >= (data?.pages || 1)}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 disabled:opacity-30 hover:text-white transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
