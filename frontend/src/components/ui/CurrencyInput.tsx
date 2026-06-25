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

// input de moeda estilo banco: dígitos deslocam da direita para a esquerda; armazena float (ex: 50.00)
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, icon, value = 0, onChange, onBlur, placeholder, disabled, className, name }, ref) => {

    const [cents, setCents] = useState<number>(() => Math.round((value ?? 0) * 100));

    useEffect(() => {
      setCents(Math.round((value ?? 0) * 100));
    }, [value]);

    const display = cents === 0
      ? ''
      : (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
