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
      {/* Page header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Órdenes</h1>
          <p className="admin-page-subtitle">{total} órdenes totales</p>
        </div>
        <button onClick={load} className="admin-icon-btn">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="dashboard-panel glass p-4 flex flex-col sm:flex-row gap-3"
      >
        <div className="admin-search-wrap">
          <Search size={13} className="admin-search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID o email…"
            className="admin-search-input"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: 'var(--text-faint)' }} />
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`filter-pill capitalize ${status === s ? 'filter-pill--active' : ''}`}>
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="dashboard-panel glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="admin-thead">
              <tr>
                {['ID', 'Usuario', 'Items', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="admin-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="admin-row">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="admin-td">
                        <div className="h-3 rounded skeleton" style={{ width: j === 1 ? '140px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">No hay órdenes</td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((o: any, i: number) => (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="admin-row"
                    >
                      <td className="admin-td admin-td--mono">{o.id.slice(0, 8)}…</td>
                      <td className="admin-td">{o.user_email}</td>
                      <td className="admin-td admin-td--muted">
                        {Array.isArray(o.items) ? `${o.items.length} item${o.items.length !== 1 ? 's' : ''}` : '—'}
                      </td>
                      <td className="admin-td admin-td--accent">
                        ${parseFloat(o.total).toFixed(2)}
                      </td>
                      <td className="admin-td"><StatusBadge value={o.status} /></td>
                      <td className="admin-td admin-td--muted">
                        {new Date(o.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination__info">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-pagination__btn"
              >
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`filter-pill w-7 h-7 p-0 flex items-center justify-center ${p === page ? 'filter-pill--active' : 'border-transparent bg-transparent'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-pagination__btn"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
