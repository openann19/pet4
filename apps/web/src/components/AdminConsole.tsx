import AdminLayout from '@/components/admin/AdminLayout'
import AdoptionApplicationReview from '@/components/admin/AdoptionApplicationReview'
import { AdoptionListingReview } from '@/components/admin/AdoptionListingReview'
import AdoptionManagement from '@/components/admin/AdoptionManagement'
import APIConfigView from '@/components/admin/APIConfigView'
import AuditLogView from '@/components/admin/AuditLogView'
import BusinessConfigPanel from '@/components/admin/BusinessConfigPanel'
import ChatModerationPanel from '@/components/admin/ChatModerationPanel'
import CommunityManagement from '@/components/admin/CommunityManagement'
import { ContentModerationQueue } from '@/components/admin/ContentModerationQueue'
import ContentView from '@/components/admin/ContentView'
import DashboardView from '@/components/admin/DashboardView'
import { KYCManagement } from '@/components/admin/KYCManagement'
import { LiveStreamManagement } from '@/components/admin/LiveStreamManagement'
import { LostFoundManagement } from '@/components/admin/LostFoundManagement'
import MapSettingsView from '@/components/admin/MapSettingsView'
import { ModerationQueue } from '@/components/admin/ModerationQueue'
import PerformanceMonitoring from '@/components/admin/PerformanceMonitoring'
import ReportsView from '@/components/admin/ReportsView'
import SettingsView from '@/components/admin/SettingsView'
import SupportChatPanel from '@/components/admin/SupportChatPanel'
import SystemMap from '@/components/admin/SystemMap'
import UsersView from '@/components/admin/UsersView'
import { VerificationReviewDashboard } from '@/components/admin/VerificationReviewDashboard'
import { SubscriptionAdminPanel } from '@/components/payments/SubscriptionAdminPanel'
import { Toaster } from '@/components/ui/sonner'
import { useState } from 'react'

type AdminView = 'dashboard' | 'reports' | 'users' | 'content' | 'verification' | 'settings' | 'map-settings' | 'audit' | 'performance' | 'system-map' | 'moderation' | 'content-moderation' | 'kyc' | 'api-config' | 'subscriptions' | 'community' | 'adoption' | 'adoption-applications' | 'adoption-listings' | 'lost-found' | 'live-streams' | 'business-config' | 'chat-moderation' | 'support-chat'

interface AdminConsoleProps {
  onClose?: () => void
}

export default function AdminConsole({ onClose }: AdminConsoleProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  return (
    <>
      <AdminLayout 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        {...(onClose ? { onExit: onClose } : {})}
      >
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
      </AdminLayout>
      <Toaster />
    </>
  )
}
