import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Search, Settings, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/Avatar';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Discover', href: '/discover', icon: Search },
  { name: 'Messages', href: '/chat', icon: MessageCircle },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const { user } = useAuth();

  return (
    <nav className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/home" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PS</span>
              </div>
              <span className="text-lg font-semibold">PETSPARK</span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* User Avatar */}
          <div className="flex items-center">
            <NavLink
              to="/profile"
              className="flex items-center space-x-2 rounded-md p-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <UserAvatar user={user!} size="sm" />
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
