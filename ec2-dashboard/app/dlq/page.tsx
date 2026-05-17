'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import AuthGuard from '../../components/AuthGuard';
import { api } from '../../lib/api';

function MessageRow({ msg, idx }: { msg: any; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
      className="glass rounded-xl border border-red-500/20 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-4 text-sm">
          <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
          <span className="text-slate-300 font-mono text-xs">{msg.content?.orderId?.slice(0, 16) || 'unknown'}…</span>
          <span className="text-slate-500 text-xs">{msg.content?.type}</span>
          <span className="text-slate-500 text-xs">{msg.content?.phone || msg.content?.email || '—'}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 px-5 py-4">
            <pre className="text-xs text-slate-300 bg-black/30 rounded-lg p-4 overflow-x-auto">
              {JSON.stringify(msg.content, null, 2)}
            </pre>
            {msg.properties?.headers && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-1">Headers</p>
                <pre className="text-xs text-slate-400 bg-black/20 rounded-lg p-3">
                  {JSON.stringify(msg.properties.headers, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DLQPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.dlq().then(setData).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dead Letter Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Messages that failed after {'{3}'} retries</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass border ${(data?.queueSize || 0) > 0 ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}>
              <AlertTriangle size={14} />
              {data?.queueSize || 0} messages
            </div>
            <button onClick={load} disabled={loading}
              className="p-2 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : data?.messages?.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl border border-green-500/20 flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Inbox size={28} className="text-green-400" />
            </div>
            <p className="text-green-400 font-medium">Queue is empty</p>
            <p className="text-slate-500 text-sm">All messages processed successfully</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {data.messages.map((msg: any, i: number) => <MessageRow key={i} msg={msg} idx={i} />)}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
