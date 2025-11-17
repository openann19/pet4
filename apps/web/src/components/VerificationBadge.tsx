import { ShieldCheck, Certificate, Star } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VerificationLevel } from '@/lib/verification-types';

interface VerificationBadgeProps {
  verified: boolean;
  level?: VerificationLevel;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({
  verified,
  level = 'basic',
  className,
  showTooltip = true,
  size = 'md',
}: VerificationBadgeProps) {
  if (!verified) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const getLevelConfig = () => {
    switch (level) {
      case 'premium':
        return {
          icon: <Certificate size={iconSizes[size]} weight="fill" />,
          label: 'Premium Verified',
          className: 'bg-linear-to-r from-yellow-500 to-orange-500 text-white border-0',
          emoji: '👑',
          description: 'Premium verified owner with complete background check',
        };
      case 'standard':
        return {
          icon: <Star size={iconSizes[size]} weight="fill" />,
          label: 'Standard Verified',
          className: 'bg-linear-to-r from-blue-500 to-purple-500 text-white border-0',
          emoji: '⭐',
          description: 'Standard verified owner with complete documentation',
        };
      default:
        return {
          icon: <ShieldCheck size={iconSizes[size]} weight="fill" />,
          label: 'Verified',
          className: 'bg-linear-to-r from-green-500 to-teal-500 text-white border-0',
          emoji: '✓',
          description: 'Basic verified owner',
        };
    }
  };

  const config = getLevelConfig();

  const badgeContent = (
    <Badge
      className={cn(
        config.className,
        sizeClasses[size],
        'font-semibold shadow-lg hover:shadow-xl transition-shadow hover:scale-105 animate-in zoom-in duration-300',
        className
      )}
    >
      <span className="mr-1">{config.emoji}</span>
      {config.icon}
      <span className="ml-1.5">{config.label}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
