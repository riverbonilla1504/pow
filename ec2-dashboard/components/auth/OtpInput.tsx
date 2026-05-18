'use client';

import {
  useRef,
  type CSSProperties,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

const cellStyle: CSSProperties = {
  width: '2.75rem',
  height: '3.25rem',
  minWidth: '2.75rem',
  minHeight: '3.25rem',
  padding: 0,
  fontSize: '1.5rem',
  fontWeight: 600,
  textAlign: 'center',
  color: 'var(--text-primary)',
  background: 'var(--bg-elevated)',
  border: '2px solid var(--border-strong)',
  borderRadius: '0.75rem',
  outline: 'none',
  caretColor: 'var(--green)',
  boxSizing: 'border-box',
};

export default function OtpInput({
  value,
  onChange,
  id,
  length = 6,
  autoFocus = false,
  disabled = false,
  className = '',
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) => {
    const i = Math.max(0, Math.min(index, length - 1));
    inputsRef.current[i]?.focus();
    inputsRef.current[i]?.select();
  };

  const applyDigits = (raw: string, focusIndex?: number) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    focusAt(focusIndex ?? Math.min(cleaned.length, length - 1));
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }
    if (v.length > 1) {
      applyDigits(value.slice(0, index) + v);
      return;
    }
    const next = (value.slice(0, index) + v[0] + value.slice(index + 1)).slice(0, length);
    onChange(next);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) return;
      if (index > 0) {
        e.preventDefault();
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    applyDigits(e.clipboardData.getData('text'));
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--green)';
    e.target.style.boxShadow = '0 0 0 3px var(--green-muted)';
    e.target.select();
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border-strong)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div
      className={`flex w-full max-w-full flex-row flex-nowrap items-center justify-center gap-2 py-1 sm:gap-2.5 ${className}`}
      role="group"
      aria-label="Código de verificación de 6 dígitos"
      onPaste={handlePaste}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          id={i === 0 && id ? id : undefined}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          style={cellStyle}
          aria-label={`Dígito ${i + 1} de ${length}`}
        />
      ))}
    </div>
  );
}
