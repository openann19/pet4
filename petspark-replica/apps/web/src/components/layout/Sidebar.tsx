import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Search, Bell, Settings, User, Heart, Camera, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/Avatar';
import { memo } from 'react';

// Extract navigation arrays as constants to prevent recreation
const SIDEBAR_NAVIGATION = [
  { name: 'Feed', href: '/home', icon: Home },
  { name: 'Discover', href: '/discover', icon: Search },
  { name: 'Messages', href: '/chat', icon: MessageCircle },
  { name: 'Notifications', href: '/notifications', icon: Bell },
] as const;

const SECONDARY_NAVIGATION = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'My Pets', href: '/pets', icon: Heart },
  { name: 'Photos', href: '/photos', icon: Camera },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const;

export const Sidebar = memo(function Sidebar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PS</span>
          </div>
          <span className="text-lg font-semibold">PETSPARK</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-x-4 rounded-lg p-2">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6 text-foreground">
            {user.displayName}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            @{user.username}
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {SIDEBAR_NAVIGATION.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </li>

          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              {SECONDARY_NAVIGATION.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
});
