'use client';

/**
 * DLQPage — visor de la Dead Letter Queue de RabbitMQ.
 * Muestra mensajes que fallaron 3 veces, con payload JSON expandible,
 * información de routing key, exchange, y botones de retry/discard.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, RotateCcw, Trash2 } from 'lucide-react';
import { adminDLQ } from '@/lib/api';

export default function DLQPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function load() {
    setLoading(true);
    adminDLQ()
      .then((r: any) => setMessages(r.messages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function parsePayload(msg: any) {
    const data = msg.content || msg.payload;
    if (!data) return '{}';
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    try { return JSON.stringify(JSON.parse(data), null, 2); }
    catch { return data; }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Dead Letter Queue</h1>
          <p className="admin-page-subtitle">
            {loading ? '…' : messages.length} mensaje{messages.length !== 1 ? 's' : ''} sin procesar
          </p>
        </div>
        <button onClick={load} className="admin-icon-btn">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Warning banner */}
      {!loading && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'color-mix(in srgb, #ef4444 8%, transparent)', border: '1px solid color-mix(in srgb, #ef4444 22%, transparent)', color: '#f87171' }}
        >
          <AlertTriangle size={15} />
          <span>Estos mensajes fallaron 3 reintentos y requieren atención manual.</span>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-panel glass h-16 skeleton" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="dashboard-panel glass flex flex-col items-center py-20 gap-4"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center callout-green">
            <AlertTriangle size={24} style={{ color: 'var(--green)' }} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>DLQ vacío</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Todos los mensajes procesados correctamente.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg: any, i: number) => {
              const open       = expanded.has(i);
              const payload    = parsePayload(msg);
              const routingKey = msg.fields?.routingKey || msg.routingKey || msg.routing_key || '—';
              const deaths     = msg.properties?.headers?.['x-death']?.[0]?.count ?? '?';
              const ts         = msg.properties?.timestamp ? new Date(msg.properties.timestamp * 1000) : null;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="dashboard-panel glass overflow-hidden"
                  style={{ borderColor: 'color-mix(in srgb, #ef4444 18%, var(--border))' }}
                >
                  {/* Header row */}
                  <button
                    onClick={() => toggleExpand(i)}
                    className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)' }}
                      >
                        <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                      </div>
                      <div>
                        <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{routingKey}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {ts ? ts.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#f87171' }}
                          >
                            {deaths}x reintento{deaths !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {open
                        ? <ChevronUp   size={15} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
                      }
                    </div>
                  </button>

                  {/* Expanded payload */}
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div className="px-5 py-4 space-y-4">
                          <div>
                            <p className="admin-filter-label mb-2">Payload</p>
                            <pre className="admin-code-pre">{payload}</pre>
                          </div>

                          {msg.properties?.headers && (
                            <div>
                              <p className="admin-filter-label mb-2">Headers</p>
                              <pre className="admin-code-pre admin-code-pre--dim">
                                {JSON.stringify(msg.properties.headers, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button className="admin-action-btn">
                              <RotateCcw size={12} /> Reintentar
                            </button>
                            <button className="admin-action-btn admin-action-btn--danger">
                              <Trash2 size={12} /> Descartar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
