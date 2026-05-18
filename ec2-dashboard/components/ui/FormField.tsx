/** FormField — input reutilizable con label, icono, hint, y estilos del design system */
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  hint?: string;
  icon?: ReactNode;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
}

export default function FormField({ label, hint, icon, type = 'text', value, onChange, placeholder, required, maxLength, minLength, autoFocus }: FormFieldProps) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
        {label}
        {hint && <span className="normal-case text-slate-600 ml-1">{hint}</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`input-base rounded-xl ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 text-sm`}
        />
      </div>
    </div>
  );
}
