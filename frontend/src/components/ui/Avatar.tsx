import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };

export default function Avatar({ name = 'U', src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src} alt={name}
        className={cn('rounded-full object-cover border border-white/10', sizes[size], className)}
      />
    );
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-neon-blue to-neon-purple border border-neon-blue/30', sizes[size], className)}>
      {getInitials(name)}
    </div>
  );
}
