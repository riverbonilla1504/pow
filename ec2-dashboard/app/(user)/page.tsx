'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Mail, MessageSquare, Zap, Shield, GitBranch, ArrowRight, Package } from 'lucide-react';

const features = [
  { icon: Mail, title: 'Email Notifications', desc: 'Automatic emails via AWS SES on every order event — confirmed, shipped, returned.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: MessageSquare, title: 'SMS Alerts', desc: 'High-value orders (+$500) trigger instant SMS via Twilio to the customer\'s phone.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: Zap, title: 'RabbitMQ Queue', desc: 'Event-driven architecture with topic exchanges, DLQ, and persistent messages.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: Shield, title: 'JWT + 2FA Auth', desc: 'RS256 tokens with optional TOTP two-factor authentication for admin routes.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: GitBranch, title: 'Role-Based Access', desc: 'Three roles: cliente, operador, admin — each with fine-grained permissions.', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { icon: Package, title: 'Dead Letter Queue', desc: 'Failed notifications after 3 retries land in the DLQ for manual review.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
];

const flow = [
  { step: '01', title: 'Place Order', desc: 'Client creates order via REST API' },
  { step: '02', title: 'Event Published', desc: 'API publishes to RabbitMQ exchange' },
  { step: '03', title: 'Workers Consume', desc: 'Email & SMS workers process queue' },
  { step: '04', title: 'Notified', desc: 'Customer receives email + SMS' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <ShoppingBag size={16} className="text-black" />
          </div>
          <span className="font-bold text-white text-sm">freck.lat</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign In</Link>
          <Link href="/register" className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all" style={{ background: 'var(--green)', color: '#000' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        {/* bg orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[128px] opacity-20 pointer-events-none" style={{ background: 'var(--green)' }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full blur-[96px] opacity-10 pointer-events-none" style={{ background: '#3b82f6' }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 glass border" style={{ color: 'var(--green)', borderColor: 'rgba(0,237,100,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
            Sistema de Notificaciones Activo
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            E-Commerce<br />
            <span style={{ color: 'var(--green)' }}>Notifications</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Plataforma de notificaciones en tiempo real para órdenes de e-commerce. Email via AWS SES, SMS via Twilio, colas con RabbitMQ.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black transition-all"
                style={{ background: 'var(--green)' }}>
                Crear Cuenta <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white glass transition-all">
                Iniciar Sesión
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center justify-center gap-12 mt-20 text-center">
          {[['5', 'EC2 Instances'], ['3', 'Microservicios'], ['2FA', 'Autenticación'], ['TLS 1.3', 'Seguridad']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-black" style={{ color: 'var(--green)' }}>{val}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Flow */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Cómo Funciona</h2>
          <p className="text-slate-500">Del pedido a la notificación en milisegundos</p>
        </motion.div>
        <div className="relative flex flex-col sm:flex-row gap-6 items-start">
          <div className="hidden sm:block absolute top-6 left-[12%] right-[12%] h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--green), transparent)' }} />
          {flow.map(({ step, title, desc }, i) => (
            <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex-1 flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-4 text-black" style={{ background: 'var(--green)' }}>
                {step}
              </div>
              <p className="font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Tecnologías</h2>
          <p className="text-slate-500">Stack completo de producción</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }} className={`glass rounded-2xl p-6 border ${bg}`}>
              <Icon size={22} className={`${color} mb-4`} />
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto glass rounded-3xl p-12 glow-green" style={{ borderColor: 'rgba(0,237,100,0.2)' }}>
          <h2 className="text-3xl font-bold text-white mb-4">Listo para empezar?</h2>
          <p className="text-slate-400 mb-8">Crea tu cuenta y haz tu primera orden. Las notificaciones llegan automáticamente.</p>
          <Link href="/register">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl font-semibold text-black" style={{ background: 'var(--green)' }}>
              Crear Cuenta Gratis
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 px-6 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs text-slate-600">freck.lat · E-Commerce Notification System · Grupo 2</p>
      </footer>
    </div>
  );
}
