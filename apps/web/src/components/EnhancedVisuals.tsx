// apps/web/src/components/EnhancedVisuals.tsx
import React, { useState, type ReactNode } from 'react';
import { MotionView } from '@petspark/motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EnhancedVisuals');

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  /**
   * Optional delay in milliseconds before card animates in.
   */
  delay?: number;
}

export function EnhancedCard({ children, className = '', delay = 0 }: EnhancedCardProps) {
  return (
    <MotionView
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay / 1000,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // sleek ease-out
      }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      {children}
    </MotionView>
  );
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className = '',
}: FloatingActionButtonProps) {
  const handleClick = React.useCallback(() => {
    try {
      onClick();
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('FloatingActionButton onClick _error', err);
    }
  }, [onClick]);

  return (
    <MotionView
      onClick={() => void handleClick()}
      className={`fixed bottom-24 right-6 z-50 flex h-14 items-center gap-3 rounded-full bg-linear-to-r from-primary to-accent px-6 text-white shadow-2xl transition-all duration-300 ${className}`}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        scale: 1.06,
      }}
      style={{
        boxShadow: '0 28px 60px rgba(0,0,0,0.45)',
      }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="text-xl">{icon}</span>
      {label && <span className="text-sm font-semibold">{label}</span>}
    </MotionView>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PulseIndicator({ color = 'bg-primary', size = 'md' }: PulseIndicatorProps) {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const baseSize = sizeClasses[size] ?? sizeClasses.md;

  return (
    <div className="relative inline-flex">
      {/* Core dot */}
      <MotionView
        className={`${baseSize} ${color} rounded-full`}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer halo */}
      <MotionView
        className={`absolute inset-0 ${color} rounded-full`}
        initial={{ scale: 1, opacity: 0.35 }}
        animate={{ scale: [1, 1.9, 1], opacity: [0.35, 0, 0.35] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'blur(4px)' }}
      />
    </div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function GradientText({
  children,
  className = '',
  from = 'from-primary',
  via = 'via-accent',
  to = 'to-secondary',
}: GradientTextProps) {
  return (
    <span
      className={`bg-linear-to-r ${from} ${via} ${to} bg-clip-text text-transparent font-bold ${className}`}
    >
      {children}
    </span>
  );
}

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Simple shimmer sweep over static content.
 */
export function Shimmer({ children, className = '' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <MotionView
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-white/18 to-transparent"
        initial={{ x: '-120%' }}
        animate={{ x: ['-120%', '120%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

interface CounterBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function CounterBadge({ count, max = 99, variant = 'primary' }: CounterBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  const variantClasses: Record<'primary' | 'secondary' | 'accent', string> = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  const colorClass = variantClasses[variant] ?? variantClasses.primary;

  return (
    <MotionView
      key={displayCount}
      className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-lg ${colorClass}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      {displayCount}
    </MotionView>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingDots({ size = 'md', color = 'bg-primary' }: LoadingDotsProps) {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const baseSize = sizeClasses[size] ?? sizeClasses.md;
  const delays = [0, 0.15, 0.3];

  return (
    <div className="flex items-center justify-center gap-1.5">
      {delays.map((delay, index) => (
        <MotionView
          key={index}
          className={`${baseSize} ${color} rounded-full`}
          initial={{ scale: 0.8, opacity: 0.3 }}
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        />
      ))}
    </div>
  );
}

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  /**
   * Tailwind color token suffix, e.g. "primary", "accent", "secondary"
   */
  glowColor?: string;
}

/**
 * Premium hover glow wrapper around cards / tiles.
 * - Subtle lift + scale on hover
 * - Soft neon border glow
 */
export function GlowingBorder({
  children,
  className = '',
  glowColor = 'primary',
}: GlowingBorderProps) {
  const [hovered, setHovered] = useState(false);

  const fromClass = `from-${glowColor}`;
  const toClass = `to-${glowColor}`;

  return (
    <MotionView
      className={`relative rounded-2xl ${className}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glow overlay */}
      <MotionView
        className={`pointer-events-none absolute -inset-[1px] rounded-inherit bg-linear-to-r ${fromClass} via-accent ${toClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 0.55 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ filter: 'blur(6px)' }}
      />
      <div className="relative rounded-inherit bg-card">{children}</div>
    </MotionView>
  );
}
