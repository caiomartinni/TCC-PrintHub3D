import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-xl hover:bg-red-500/30 active:scale-95 transition-all duration-200',
      outline: 'inline-flex items-center justify-center gap-2 px-6 py-3 border border-neon-blue/30 text-neon-blue font-semibold rounded-xl hover:bg-neon-blue/10 active:scale-95 transition-all duration-200',
    };

    const sizes = {
      sm: '!px-3 !py-1.5 text-sm',
      md: '',
      lg: '!px-8 !py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
