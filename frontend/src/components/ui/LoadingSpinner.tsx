import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' };

export default function LoadingSpinner({ size = 'md', className, fullScreen }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('rounded-full border-neon-blue/20 border-t-neon-blue animate-spin', sizes[size], className)} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-gray-400 animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
