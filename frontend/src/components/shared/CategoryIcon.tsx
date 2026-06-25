import {
  Home, Cog, Gamepad2, Gem, Wrench, GraduationCap, Palette, Car, Shapes,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  decoracao: Home,
  'pecas-mecanicas': Cog,
  brinquedos: Gamepad2,
  joias: Gem,
  utilitarios: Wrench,
  educacional: GraduationCap,
  arte: Palette,
  automotivo: Car,
};

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function CategoryIcon({ slug, size = 20, className = 'text-white', strokeWidth = 1.5 }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[slug] ?? Shapes;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
