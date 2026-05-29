import { cn } from '@/utils/cn';

type BadgeVariant = 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  blue: 'badge-blue',
  purple: 'badge-purple',
  green: 'badge-green',
  yellow: 'badge-yellow',
  red: 'badge-red',
  gray: 'badge bg-white/10 text-gray-300 border border-white/20',
};

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return <span className={cn(variants[variant], className)}>{children}</span>;
}
