'use client';

/**
 * NotificationsPage — historial de notificaciones enviadas por el sistema.
 * Muestra: tabla de logs con filtros por tipo (email/sms) y estado (sent/failed),
 * detalle de destinatario, template usado, y paginación.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminNotifications } from '@/lib/api';

/** Configuración visual por tipo de notificación */
const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  email: { icon: Mail,          color: '#3b82f6', label: 'Email' },
  sms:   { icon: MessageSquare, color: '#8b5cf6', label: 'SMS'   },
};

const STATUS_CONFIG: Record<string, { icon: any; color: string }> = {
  sent:    { icon: CheckCircle, color: '#22c55e' },
  failed:  { icon: XCircle,     color: '#ef4444' },
  pending: { icon: Clock,       color: '#eab308' },
};

const TYPES    = ['all', 'email', 'sms'];
const STATUSES = ['all', 'sent', 'failed', 'pending'];

export default function NotificationsPage() {
  const [rows, setRows]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [type, setType]       = useState('all');
  const [status, setStatus]   = useState('all');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    adminNotifications(
      page, limit,
      type   !== 'all' ? type   : undefined,
      status !== 'all' ? status : undefined,
    )
      .then((r: any) => { setRows(r.notifications || []); setTotal(r.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, type, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [type, status]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Notificaciones</h1>
          <p className="admin-page-subtitle">{total} registros</p>
        </div>
        <button onClick={load} className="admin-icon-btn">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="dashboard-panel glass p-4 flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2">
          <span className="admin-filter-label">Tipo</span>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`filter-pill capitalize ${type === t ? 'filter-pill--active' : ''}`}>
              {t === 'all' ? 'Todos' : t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="admin-filter-label">Estado</span>
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
                {['Tipo', 'Orden', 'Destinatario', 'Template', 'Estado', 'Error', 'Fecha'].map(h => (
                  <th key={h} className="admin-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="admin-row">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="admin-td">
                        <div className="h-3 rounded skeleton" style={{ width: j === 2 ? '160px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">Sin registros</td>
                </tr>
              ) : (
                <AnimatePresence>
                  {rows.map((n: any, i: number) => {
                    const typeConf   = TYPE_CONFIG[n.type]     || { icon: Mail,  color: 'var(--text-muted)', label: n.type };
                    const statusConf = STATUS_CONFIG[n.status] || { icon: Clock, color: 'var(--text-muted)' };
                    const TypeIcon   = typeConf.icon;
                    const StatusIcon = statusConf.icon;
                    return (
                      <motion.tr
                        key={n.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="admin-row"
                      >
                        <td className="admin-td">
                          <div className="flex items-center gap-2">
                            <TypeIcon size={13} style={{ color: typeConf.color }} />
                            <span className="text-xs font-medium" style={{ color: typeConf.color }}>{typeConf.label}</span>
                          </div>
                        </td>
                        <td className="admin-td admin-td--mono">{n.order_id?.slice(0, 8)}…</td>
                        <td className="admin-td" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.recipient}
                        </td>
                        <td className="admin-td admin-td--muted">{n.template || '—'}</td>
                        <td className="admin-td">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon size={12} style={{ color: statusConf.color }} />
                            <span className="text-xs capitalize" style={{ color: statusConf.color }}>{n.status}</span>
                          </div>
                        </td>
                        <td className="admin-td" style={{ color: '#f87171', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.error_message || '—'}
                        </td>
                        <td className="admin-td admin-td--muted">
                          {new Date(n.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination__info">Página {page} de {totalPages}</span>
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
