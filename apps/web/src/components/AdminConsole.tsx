import type { ComponentType } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { SubscriptionAdminPanel } from '@/components/payments/SubscriptionAdminPanel';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect, lazy, Suspense } from 'react';
import { adminSyncService } from '@/core/services/admin-sync-service';
import { realtime } from '@/lib/realtime';

// Helper function to create lazy loader for components with default export
function createLazyDefault<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

// Helper function to create lazy loader for components with named export
function createLazyNamed<T extends ComponentType<unknown>>(
  importFn: () => Promise<Record<string, T>>,
  exportName: string
) {
  return lazy(async () => {
    const module = await importFn();
    const Component = module[exportName];
    if (!Component) {
      throw new Error(`Component ${exportName} not found in module`);
    }
    return { default: Component };
  });
}

// Lazy load all admin components for code splitting
const AdoptionApplicationReview = createLazyDefault(
  () => import('@/components/admin/AdoptionApplicationReview')
);
const AdoptionListingReview = createLazyNamed(
  () => import('@/components/admin/AdoptionListingReview'),
  'AdoptionListingReview'
);
const AdoptionManagement = createLazyDefault(() => import('@/components/admin/AdoptionManagement'));
const APIConfigView = createLazyDefault(() => import('@/components/admin/APIConfigView'));
const AuditLogView = createLazyDefault(() => import('@/components/admin/AuditLogView'));
const BusinessConfigPanel = createLazyDefault(
  () => import('@/components/admin/BusinessConfigPanel')
);
const ChatModerationPanel = createLazyDefault(
  () => import('@/components/admin/ChatModerationPanel')
);
const CommunityManagement = createLazyDefault(
  () => import('@/components/admin/CommunityManagement')
);
const ContentModerationQueue = createLazyNamed(
  () => import('@/components/admin/ContentModerationQueue'),
  'ContentModerationQueue'
);
const ContentView = createLazyDefault(() => import('@/components/admin/ContentView'));
const DashboardView = createLazyDefault(() => import('@/components/admin/DashboardView'));
const KYCManagement = createLazyNamed(
  () => import('@/components/admin/KYCManagement'),
  'KYCManagement'
);
const LiveStreamManagement = createLazyNamed(
  () => import('@/components/admin/LiveStreamManagement'),
  'LiveStreamManagement'
);
const LostFoundManagement = createLazyNamed(
  () => import('@/components/admin/LostFoundManagement'),
  'LostFoundManagement'
);
const MapSettingsView = createLazyDefault(() => import('@/components/admin/MapSettingsView'));
const ModerationQueue = createLazyNamed(
  () => import('@/components/admin/ModerationQueue'),
  'ModerationQueue'
);
const PerformanceMonitoring = createLazyDefault(
  () => import('@/components/admin/PerformanceMonitoring')
);
const ReportsView = createLazyDefault(() => import('@/components/admin/ReportsView'));
const SettingsView = createLazyDefault(() => import('@/components/admin/SettingsView'));
const SupportChatPanel = createLazyDefault(() => import('@/components/admin/SupportChatPanel'));
const SystemMap = createLazyDefault(() => import('@/components/admin/SystemMap'));
const UsersView = createLazyDefault(() => import('@/components/admin/UsersView'));
const VerificationReviewDashboard = createLazyNamed(
  () => import('@/components/admin/VerificationReviewDashboard'),
  'VerificationReviewDashboard'
);

// Loading fallback component
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading admin panel...</p>
    </div>
  </div>
);

type AdminView =
  | 'dashboard'
  | 'reports'
  | 'users'
  | 'content'
  | 'verification'
  | 'settings'
  | 'map-settings'
  | 'audit'
  | 'performance'
  | 'system-map'
  | 'moderation'
  | 'content-moderation'
  | 'kyc'
  | 'api-config'
  | 'subscriptions'
  | 'community'
  | 'adoption'
  | 'adoption-applications'
  | 'adoption-listings'
  | 'lost-found'
  | 'live-streams'
  | 'business-config'
  | 'chat-moderation'
  | 'support-chat';

interface AdminConsoleProps {
  onClose?: () => void;
}

export default function AdminConsole({ onClose }: AdminConsoleProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  // Initialize admin sync service on mount
  useEffect(() => {
    adminSyncService.initialize(realtime);

    return () => {
      adminSyncService.disconnect();
    };
  }, []);

  return (
    <>
      <AdminLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        {...(onClose ? { onExit: onClose } : {})}
      >
        <Suspense fallback={<AdminLoadingFallback />}>
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'subscriptions' && <SubscriptionAdminPanel />}
          {currentView === 'business-config' && <BusinessConfigPanel />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'community' && <CommunityManagement />}
          {currentView === 'adoption' && <AdoptionManagement />}
          {currentView === 'adoption-applications' && <AdoptionApplicationReview />}
          {currentView === 'adoption-listings' && <AdoptionListingReview />}
          {currentView === 'lost-found' && <LostFoundManagement />}
          {currentView === 'live-streams' && <LiveStreamManagement />}
          {currentView === 'content' && <ContentView />}
          {currentView === 'moderation' && <ModerationQueue />}
          {currentView === 'content-moderation' && <ContentModerationQueue />}
          {currentView === 'chat-moderation' && <ChatModerationPanel />}
          {currentView === 'support-chat' && <SupportChatPanel />}
          {currentView === 'kyc' && <KYCManagement />}
          {currentView === 'audit' && <AuditLogView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'api-config' && <APIConfigView />}
          {currentView === 'map-settings' && <MapSettingsView />}
          {currentView === 'performance' && <PerformanceMonitoring />}
          {currentView === 'system-map' && <SystemMap />}
          {currentView === 'verification' && <VerificationReviewDashboard />}
        </Suspense>
      </AdminLayout>
      <Toaster />
    </>
  );
}
