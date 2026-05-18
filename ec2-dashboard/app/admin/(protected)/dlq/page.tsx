'use client';
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dead Letter Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '…' : messages.length} mensaje{messages.length !== 1 ? 's' : ''} sin procesar
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Warning banner */}
      {!loading && messages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          <AlertTriangle size={15} />
          <span>Estos mensajes fallaron 3 reintentos y requieren atención manual.</span>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-16 skeleton" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl flex flex-col items-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center callout-green">
            <AlertTriangle size={24} style={{ color: 'var(--green)' }} />
          </div>
          <p className="text-slate-300 font-semibold">DLQ vacío</p>
          <p className="text-slate-600 text-sm">Todos los mensajes procesados correctamente.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg: any, i: number) => {
              const open = expanded.has(i);
              const payload = parsePayload(msg);
              const routingKey = msg.fields?.routingKey || msg.routingKey || msg.routing_key || '—';
              const deaths = msg.properties?.headers?.['x-death']?.[0]?.count ?? '?';
              const ts = msg.properties?.timestamp ? new Date(msg.properties.timestamp * 1000) : null;

              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
                  {/* Header */}
                  <button onClick={() => toggleExpand(i)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                      </div>
                      <div>
                        <p className="text-sm font-mono text-white">{routingKey}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-600">
                            {ts ? ts.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            {deaths}x reintento{deaths !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {open ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                    </div>
                  </button>

                  {/* Payload */}
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="px-5 py-4">
                          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Payload</p>
                          <pre className="text-xs text-slate-300 overflow-x-auto p-3 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', maxHeight: '300px', overflowY: 'auto' }}>
                            {payload}
                          </pre>

                          {msg.properties?.headers && (
                            <>
                              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 mt-4">Headers</p>
                              <pre className="text-xs text-slate-500 overflow-x-auto p-3 rounded-xl"
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', maxHeight: '150px', overflowY: 'auto' }}>
                                {JSON.stringify(msg.properties.headers, null, 2)}
                              </pre>
                            </>
                          )}

                          <div className="flex items-center gap-2 mt-4">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                              <RotateCcw size={12} /> Reintentar
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors"
                              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
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
