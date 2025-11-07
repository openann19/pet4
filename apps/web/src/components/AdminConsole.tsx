import AdminLayout from '@/components/admin/AdminLayout'
import { SubscriptionAdminPanel } from '@/components/payments/SubscriptionAdminPanel'
import { Toaster } from '@/components/ui/sonner'
import { useState, useEffect, lazy, Suspense } from 'react'
import { adminSyncService } from '@/core/services/admin-sync-service'
import { realtime } from '@/lib/realtime'

// Lazy load all admin components for code splitting
const AdoptionApplicationReview = lazy(() => import('@/components/admin/AdoptionApplicationReview').then(module => ({ default: module.default })))
const AdoptionListingReview = lazy(() => import('@/components/admin/AdoptionListingReview').then(module => ({ AdoptionListingReview: module.AdoptionListingReview })))
const AdoptionManagement = lazy(() => import('@/components/admin/AdoptionManagement').then(module => ({ default: module.default })))
const APIConfigView = lazy(() => import('@/components/admin/APIConfigView').then(module => ({ default: module.default })))
const AuditLogView = lazy(() => import('@/components/admin/AuditLogView').then(module => ({ default: module.default })))
const BusinessConfigPanel = lazy(() => import('@/components/admin/BusinessConfigPanel').then(module => ({ default: module.default })))
const ChatModerationPanel = lazy(() => import('@/components/admin/ChatModerationPanel').then(module => ({ default: module.default })))
const CommunityManagement = lazy(() => import('@/components/admin/CommunityManagement').then(module => ({ default: module.default })))
const ContentModerationQueue = lazy(() => import('@/components/admin/ContentModerationQueue').then(module => ({ ContentModerationQueue: module.ContentModerationQueue })))
const ContentView = lazy(() => import('@/components/admin/ContentView').then(module => ({ default: module.default })))
const DashboardView = lazy(() => import('@/components/admin/DashboardView').then(module => ({ default: module.default })))
const KYCManagement = lazy(() => import('@/components/admin/KYCManagement').then(module => ({ KYCManagement: module.KYCManagement })))
const LiveStreamManagement = lazy(() => import('@/components/admin/LiveStreamManagement').then(module => ({ LiveStreamManagement: module.LiveStreamManagement })))
const LostFoundManagement = lazy(() => import('@/components/admin/LostFoundManagement').then(module => ({ LostFoundManagement: module.LostFoundManagement })))
const MapSettingsView = lazy(() => import('@/components/admin/MapSettingsView').then(module => ({ default: module.default })))
const ModerationQueue = lazy(() => import('@/components/admin/ModerationQueue').then(module => ({ ModerationQueue: module.ModerationQueue })))
const PerformanceMonitoring = lazy(() => import('@/components/admin/PerformanceMonitoring').then(module => ({ default: module.default })))
const ReportsView = lazy(() => import('@/components/admin/ReportsView').then(module => ({ default: module.default })))
const SettingsView = lazy(() => import('@/components/admin/SettingsView').then(module => ({ default: module.default })))
const SupportChatPanel = lazy(() => import('@/components/admin/SupportChatPanel').then(module => ({ default: module.default })))
const SystemMap = lazy(() => import('@/components/admin/SystemMap').then(module => ({ default: module.default })))
const UsersView = lazy(() => import('@/components/admin/UsersView').then(module => ({ default: module.default })))
const VerificationReviewDashboard = lazy(() => import('@/components/admin/VerificationReviewDashboard').then(module => ({ VerificationReviewDashboard: module.VerificationReviewDashboard })))

// Loading fallback component
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading admin panel...</p>
    </div>
  </div>
)

type AdminView = 'dashboard' | 'reports' | 'users' | 'content' | 'verification' | 'settings' | 'map-settings' | 'audit' | 'performance' | 'system-map' | 'moderation' | 'content-moderation' | 'kyc' | 'api-config' | 'subscriptions' | 'community' | 'adoption' | 'adoption-applications' | 'adoption-listings' | 'lost-found' | 'live-streams' | 'business-config' | 'chat-moderation' | 'support-chat'

interface AdminConsoleProps {
  onClose?: () => void
}

export default function AdminConsole({ onClose }: AdminConsoleProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  // Initialize admin sync service on mount
  useEffect(() => {
    adminSyncService.initialize(realtime)
    
    return () => {
      adminSyncService.disconnect()
    }
  }, [])

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
  )
}
