'use client';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { View } from '@/lib/routes';

interface NavItem {
  view: View;
  label: string;
  icon: string;
  badge?: number;
}

const items: NavItem[] = [
  { view: 'discover', label: 'Premium', icon: '💎' },
  { view: 'chat', label: 'Chat', icon: '💬' },
  { view: 'matches', label: 'Matches', icon: '❤️' },
  { view: 'adoption', label: 'Adopt', icon: '🐾' },
  { view: 'community', label: 'Community', icon: '👥' },
  { view: 'profile', label: 'Profile', icon: '👤' },
];

interface BottomNavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export default function BottomNavBar({ currentView, setCurrentView }: BottomNavBarProps) {
  const [hoveredItem, setHoveredItem] = useState<View | null>(null);

  const activeIndex = useMemo(
    () => items.findIndex((item) => item.view === currentView),
    [currentView]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full">
      <nav 
        className="border-t border-border/10 bg-background/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
        aria-label="Bottom navigation"
      >
        <ul 
          className="relative grid grid-cols-6 max-w-xl mx-auto px-2 py-2 gap-1"
          role="list"
        >
          {activeIndex >= 0 && (
            <li
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-y-1 rounded-2xl bg-accent/10 transition-transform duration-250 ease-out',
              )}
              style={{
                transform: `translateX(${activeIndex * 100}%)`,
                width: 'calc(100% / 6)',
              }}
            />
          )}
          {items.map((item) => {
            const isActive = currentView === item.view;
            const isHovered = hoveredItem === item.view;

            return (
              <NavItem
                key={item.view}
                item={item}
                isActive={isActive}
                isHovered={isHovered}
                onHover={() => { setHoveredItem(item.view); }}
                onLeave={() => { setHoveredItem(null); }}
                onClick={() => { setCurrentView(item.view); }}
              />
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function NavItem({ item, isActive, isHovered, onHover, onLeave, onClick }: NavItemProps) {
  const handleClick = useCallback(() => {
    if (!isActive) {
      haptics.impact('light');
    }
    onClick();
  }, [isActive, onClick]);

  return (
    <li className="text-center relative" role="listitem">
      <button
        className="block relative py-2 px-1 w-full rounded-2xl transition-colors duration-150 hover:bg-accent/10 active:bg-accent/15"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={handleClick}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          {/* Icon container */}
          <div 
            className={cn(
              'relative transition-transform duration-200',
              isActive ? 'scale-110 translate-y-0' : 'scale-100 translate-y-[1px]',
              isHovered && !isActive ? 'scale-105' : ''
            )}
            aria-hidden="true"
          >
            <span className="text-lg leading-none select-none">{item.icon}</span>
          </div>

          {/* Label */}
          <span
            className={cn(
              'text-[11px] font-medium transition-colors duration-150',
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
            )}
          >
            {item.label}
          </span>

          {/* Badge */}
          {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
            <Badge count={item.badge} isActive={isActive} />
          )}
        </div>
      </button>
    </li>
  );
}

interface BadgeProps {
  count: number;
  isActive: boolean;
}

function Badge({ count, isActive }: BadgeProps) {
  return (
    <div
      className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-destructive flex items-center justify-center shadow-md z-20 px-0.5"
      aria-label={`${count} ${count === 1 ? 'notification' : 'notifications'}`}
    >
      <span className="text-[10px] font-bold text-destructive-foreground leading-none">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
}
