const styles: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  paid:      'bg-blue-500/15 text-blue-300 border-blue-500/25',
  shipped:   'bg-violet-500/15 text-violet-300 border-violet-500/25',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  returned:  'bg-red-500/15 text-red-300 border-red-500/25',
  sent:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  failed:    'bg-red-500/15 text-red-300 border-red-500/25',
  email:     'bg-blue-500/15 text-blue-300 border-blue-500/25',
  sms:       'bg-violet-500/15 text-violet-300 border-violet-500/25',
  admin:     'bg-red-500/15 text-red-300 border-red-500/25',
  operador:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  cliente:   'bg-slate-500/15 text-slate-300 border-slate-500/25',
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${styles[value] || 'bg-slate-500/15 text-slate-300 border-slate-500/25'}`}>
      {value}
    </span>
  );
}
