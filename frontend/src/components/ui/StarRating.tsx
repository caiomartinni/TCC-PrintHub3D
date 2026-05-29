import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export default function StarRating({ rating, max = 5, size = 14, showValue = false, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-700 text-gray-700'}
        />
      ))}
      {showValue && <span className="text-sm text-gray-400 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}
