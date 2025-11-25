import { Outlet } from 'react-router-dom';
import { memo } from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';

export const MainLayout = memo(function MainLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNavigation />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>
      </div>
    </div>
  );
});
