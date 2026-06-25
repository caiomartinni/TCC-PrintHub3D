import { forwardRef, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

/**
 * Brazilian-style currency input.
 * Digits shift left-to-right as in bank apps.
 * Stores value as a float (e.g. 50.00).
 * Type "5000" → displays "50,00".
 */
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, icon, value = 0, onChange, onBlur, placeholder, disabled, className, name }, ref) => {

    // Keep an integer of cents internally
    const [cents, setCents] = useState<number>(() => Math.round((value ?? 0) * 100));

    // Sync when parent changes value (e.g. form reset)
    useEffect(() => {
      setCents(Math.round((value ?? 0) * 100));
    }, [value]);

    const display = cents === 0
      ? ''
      : (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip everything except digits
      const raw = e.target.value.replace(/\D/g, '');
      const newCents = raw ? Math.min(parseInt(raw, 10), 99_999_999) : 0; // cap at 999.999,99
      setCents(newCents);
      onChange?.(newCents / 100);
    };

    return (
      <div className="w-full">
        {label && <label className="label">{label}</label>}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
          )}
          <input
            ref={ref}
            name={name}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder ?? '0,00'}
            className={cn(
              'input',
              icon && 'pl-10',
              error && 'border-red-500/50 focus:border-red-500/70',
              className
            )}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
export default CurrencyInput;
