import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Package, Award } from 'lucide-react';
import type { MakerProfile } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { formatDistance } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MakerCardProps {
  maker: MakerProfile;
  className?: string;
}

export default function MakerCard({ maker, className }: MakerCardProps) {
  return (
    <Link to={`/maker/${maker.id}`} className="group block">
      <div className={cn('glass rounded-2xl p-5 border border-white/10 hover:border-neon-purple/30 hover:shadow-neon-purple transition-all duration-300', className)}>
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={maker.user?.name || maker.companyName} src={maker.user?.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate group-hover:text-neon-purple transition-colors">
                {maker.companyName || maker.user?.name}
              </h3>
              {maker.kycStatus === 'APPROVED' && (
                <Award size={14} className="text-neon-blue shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">{maker.city}, {maker.state}</span>
              {maker.distance !== undefined && (
                <Badge variant="gray" className="ml-1 text-xs">{formatDistance(maker.distance)}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Rating & Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{maker.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({maker.totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package size={12} />
            <span>{maker.totalOrders} pedidos</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>~{maker.responseTime}h</span>
          </div>
        </div>

        {/* Bio */}
        {maker.bio && (
          <p className="text-xs text-gray-400 mt-3 line-clamp-2">{maker.bio}</p>
        )}

        {/* Materials */}
        <div className="flex flex-wrap gap-1 mt-3">
          {maker.materials.slice(0, 4).map((m) => (
            <Badge key={m} variant="purple" className="text-xs">{m}</Badge>
          ))}
          {maker.materials.length > 4 && (
            <Badge variant="gray" className="text-xs">+{maker.materials.length - 4}</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
