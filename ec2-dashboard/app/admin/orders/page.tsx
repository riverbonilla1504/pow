'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminOrders } from '@/lib/api';
import StatusBadge from '@/components/shared/StatusBadge';

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'returned'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    adminOrders(page, limit, status === 'all' ? undefined : status)
      .then((r: any) => { setOrders(r.orders || []); setTotal(r.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const filtered = search
    ? orders.filter(o => o.id.includes(search) || o.user_email?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Órdenes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} órdenes totales</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID o email…"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-600" />
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: status === s ? 'rgba(0,237,100,0.15)' : 'rgba(255,255,255,0.04)',
                border: status === s ? '1px solid rgba(0,237,100,0.3)' : '1px solid var(--border)',
                color: status === s ? 'var(--green)' : '#64748b',
              }}>
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-600 uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Usuario', 'Items', 'Total', 'Estado', 'Fecha'].map(h => (
                <th key={h} className="px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 rounded skeleton" style={{ width: j === 1 ? '140px' : '60px' }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-600 text-sm">No hay órdenes</td></tr>
            ) : (
              <AnimatePresence>
                {filtered.map((o: any, i: number) => (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/2 transition-colors" style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{o.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-xs text-slate-300">{o.user_email}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {Array.isArray(o.items) ? `${o.items.length} item${o.items.length !== 1 ? 's' : ''}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: 'var(--green)' }}>
                      ${parseFloat(o.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-3"><StatusBadge value={o.status} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {new Date(o.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs text-slate-600">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: p === page ? 'rgba(0,237,100,0.15)' : 'transparent',
                      color: p === page ? 'var(--green)' : '#64748b',
                      border: p === page ? '1px solid rgba(0,237,100,0.3)' : '1px solid transparent',
                    }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
