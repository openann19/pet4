import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { User, Pet } from '@shared/types';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  online?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', fallback, online, ...props }, ref) => {
    const getInitials = (name?: string): string => {
      if (!name) return '?';
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<span class="flex h-full w-full items-center justify-center bg-muted font-medium">${getInitials(fallback || alt)}</span>`;
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted font-medium">
            {getInitials(fallback || alt)}
          </div>
        )}
        
        {online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Convenience components for specific entities
export const UserAvatar = forwardRef<HTMLDivElement, Omit<AvatarProps, 'fallback'> & { user: User }>(
  ({ user, ...props }, ref) => (
    <Avatar
      ref={ref}
      src={user.avatar}
      alt={user.displayName}
      fallback={user.displayName}
      {...props}
    />
  )
);

UserAvatar.displayName = 'UserAvatar';

export const PetAvatar = forwardRef<HTMLDivElement, Omit<AvatarProps, 'fallback'> & { pet: Pet }>(
  ({ pet, ...props }, ref) => (
    <Avatar
      ref={ref}
      src={pet.images[0]}
      alt={pet.name}
      fallback={pet.name}
      {...props}
    />
  )
);

PetAvatar.displayName = 'PetAvatar';

export { Avatar };
