import { forwardRef, memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { User, Pet } from '@shared/types';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  online?: boolean;
  layoutId?: string;
  enableAnimation?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = memo(forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', fallback, online, layoutId, enableAnimation = true, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const initials = useMemo(() => {
      const getInitials = (name?: string): string => {
        if (!name) return '?';
        return name
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
      };
      return getInitials(fallback || alt);
    }, [fallback, alt]);

    const showImage = src && !imageError;
    const MotionComponent = enableAnimation ? motion.div : 'div';
    const motionProps = enableAnimation ? {
      layout: true,
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.2 },
      ...(layoutId && { layoutId }),
      ...(props.style && { style: props.style }),
    } : {};

    // Create filtered props without style and motion props to avoid type conflicts
    const {
      style: _style,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      onDragOver: _onDragOver,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      ...filteredProps
    } = props;

    return (
      <MotionComponent
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        role="img"
        aria-label={alt || 'Avatar'}
        {...motionProps}
        {...filteredProps}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted font-medium" aria-hidden="true">
            {initials}
          </div>
        )}

        {online && (
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
            aria-label="Online status"
          />
        )}
      </MotionComponent>
    );
  }
));

Avatar.displayName = 'MemoizedAvatar';

// Convenience components for specific entities
export const UserAvatar = memo(forwardRef<HTMLDivElement, Omit<AvatarProps, 'fallback'> & { user: User }>(
  ({ user, ...props }, ref) => (
    <Avatar
      ref={ref}
      alt={user.displayName}
      fallback={user.displayName}
      layoutId={`user-${user.id}`}
      {...(user.avatar && { src: user.avatar })}
      {...props}
    />
  )
));

UserAvatar.displayName = 'MemoizedUserAvatar';

export const PetAvatar = memo(forwardRef<HTMLDivElement, Omit<AvatarProps, 'fallback'> & { pet: Pet }>(
  ({ pet, ...props }, ref) => (
    <Avatar
      ref={ref}
      alt={pet.name}
      fallback={pet.name}
      layoutId={`pet-${pet.id}`}
      {...(pet.images[0] && { src: pet.images[0] })}
      {...props}
    />
  )
));

PetAvatar.displayName = 'MemoizedPetAvatar';

export { Avatar };
