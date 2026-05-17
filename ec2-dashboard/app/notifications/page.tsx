'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft, ChevronRight, Mail, MessageSquare } from 'lucide-react';
import AuthGuard from '../../components/AuthGuard';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../lib/api';

export default function NotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.notifications(page).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{data?.total || 0} notifications sent</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Recipient</th>
                  <th className="px-5 py-3 text-left">Template</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Order ID</th>
                  <th className="px-5 py-3 text-left">Error</th>
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
                ) : data?.notifications?.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No notifications yet</td></tr>
                ) : data?.notifications?.map((n: any, i: number) => (
                  <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {n.type === 'email' ? <Mail size={13} className="text-blue-400" /> : <MessageSquare size={13} className="text-purple-400" />}
                        <StatusBadge value={n.type} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{n.recipient}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">{n.template}</td>
                    <td className="px-5 py-3"><StatusBadge value={n.status} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{n.order_id ? n.order_id.slice(0, 8) + '…' : '—'}</td>
                    <td className="px-5 py-3 text-red-400 text-xs max-w-[200px] truncate">{n.error_msg || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(n.created_at).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
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
