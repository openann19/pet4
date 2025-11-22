import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Search, Settings, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/Avatar';

const mobileNavigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Discover', href: '/discover', icon: Search },
  { name: 'Messages', href: '/chat', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: User },
];

export function MobileNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <div className="flex items-center justify-between border-b border-border bg-background p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PS</span>
          </div>
          <span className="text-lg font-semibold">PETSPARK</span>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 md:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-background">
          <div className="flex h-16 items-center justify-between border-b border-border p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PS</span>
              </div>
              <span className="text-lg font-semibold">PETSPARK</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-x-4 rounded-lg p-4">
            <UserAvatar user={user!} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-6 text-foreground">
                {user?.displayName}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                @{user?.username}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-4">
            <ul role="list" className="space-y-2">
              {mobileNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors',
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

            <div className="mt-auto pt-4">
              <NavLink
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Settings className="h-6 w-6 shrink-0" />
                Settings
              </NavLink>
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:hidden">
        <nav className="grid grid-cols-4 gap-1">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
