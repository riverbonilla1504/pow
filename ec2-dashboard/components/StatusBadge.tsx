import clsx from 'clsx';

const styles: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  paid:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shipped:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/30',
  returned:  'bg-red-500/15 text-red-400 border-red-500/30',
  sent:      'bg-green-500/15 text-green-400 border-green-500/30',
  failed:    'bg-red-500/15 text-red-400 border-red-500/30',
  email:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  sms:       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  admin:     'bg-red-500/15 text-red-400 border-red-500/30',
  operador:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  cliente:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize', styles[value] || 'bg-slate-500/15 text-slate-400 border-slate-500/30')}>
      {value}
    </span>
  );
}
