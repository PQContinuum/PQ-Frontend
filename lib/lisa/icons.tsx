'use client';

import {
  Video,
  Image,
  Smartphone,
  Clapperboard,
  Tv,
  GraduationCap,
  Share2,
  UserCircle,
  Mountain,
  Package,
  Palette,
  Camera,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Target,
  LayoutGrid,
  PenLine,
  User,
  Settings,
  Languages,
  Eye,
  type LucideIcon,
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Video,
  Image,
  Smartphone,
  Clapperboard,
  Tv,
  GraduationCap,
  Share2,
  UserCircle,
  Mountain,
  Package,
  Palette,
  Camera,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Target,
  LayoutGrid,
  PenLine,
  User,
  Settings,
  Languages,
  Eye,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function LisaIcon({ name, className = '', size = 24 }: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return <IconComponent className={className} size={size} />;
}

export function getIconComponent(name: string): LucideIcon | null {
  return iconMap[name] || null;
}
