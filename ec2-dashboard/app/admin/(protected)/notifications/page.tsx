'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminNotifications } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  email: { icon: Mail, color: '#3b82f6', label: 'Email' },
  sms:   { icon: MessageSquare, color: '#8b5cf6', label: 'SMS' },
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Notificaciones</h1>
          <p className="text-slate-500 text-sm mt-1">{total} registros</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 uppercase tracking-wider">Tipo</span>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: type === t ? 'rgba(0,237,100,0.15)' : 'rgba(255,255,255,0.04)',
                border: type === t ? '1px solid rgba(0,237,100,0.3)' : '1px solid var(--border)',
                color: type === t ? 'var(--green)' : '#64748b',
              }}>
              {t === 'all' ? 'Todos' : t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 uppercase tracking-wider">Estado</span>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
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
              {['Tipo', 'Orden', 'Destinatario', 'Template', 'Estado', 'Mensaje de Error', 'Fecha'].map(h => (
                <th key={h} className="px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 rounded skeleton" style={{ width: j === 2 ? '160px' : '70px' }} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-600 text-sm">Sin registros</td></tr>
            ) : (
              <AnimatePresence>
                {rows.map((n: any, i: number) => {
                  const typeConf   = TYPE_CONFIG[n.type]   || { icon: Mail,         color: '#64748b', label: n.type };
                  const statusConf = STATUS_CONFIG[n.status] || { icon: Clock, color: '#64748b' };
                  const TypeIcon   = typeConf.icon;
                  const StatusIcon = statusConf.icon;
                  return (
                    <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/2 transition-colors" style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={13} style={{ color: typeConf.color }} />
                          <span className="text-xs font-medium" style={{ color: typeConf.color }}>{typeConf.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{n.order_id?.slice(0, 8)}…</td>
                      <td className="px-5 py-3 text-xs text-slate-300 max-w-[180px] truncate">{n.recipient}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{n.template || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon size={12} style={{ color: statusConf.color }} />
                          <span className="text-xs capitalize" style={{ color: statusConf.color }}>{n.status}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-red-400 max-w-[200px] truncate">{n.error_message || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(n.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs text-slate-600">Página {page} de {totalPages}</span>
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
