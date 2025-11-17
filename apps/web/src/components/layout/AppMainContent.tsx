/**
 * App Main Content Component
 * Main content area with view routing
 */

import { Suspense, lazy } from 'react'
import { MotionView } from '@petspark/motion'
import LoadingState from '@/components/LoadingState'
import type { View } from '@/lib/routes'

const DiscoverView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/DiscoverView'))
const MatchesView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/MatchesView'))
const ProfileView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ProfileView'))
const ChatView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/ChatView'))
const CommunityView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/CommunityView'))
const AdoptionView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/AdoptionView'))
const LostFoundView = lazy(() => import(/* webpackPrefetch: true */ '@/components/views/LostFoundView'))

interface AppMainContentProps {
  currentView: View
  navigation: {
    navigateToView: (view: View) => void
    navigate?: (config: any) => void
    routes?: any
  }
  animations: {
    loadingTransition: {
      style: React.CSSProperties
    }
    pageTransition: {
      style: React.CSSProperties
    }
  }
}

export function AppMainContent({ currentView, navigation, animations }: AppMainContentProps) {
  const viewLabels: Record<View, string> = {
    discover: 'Discover pets',
    matches: 'Matches',
    chat: 'Chat',
    community: 'Community',
    adoption: 'Adoption',
    'lost-found': 'Lost and Found',
    profile: 'Profile',
  };

  return (
    <main 
      className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10"
      aria-label={viewLabels[currentView] || 'Main content'}
    >
      <Suspense
        fallback={
          <MotionView style={animations.loadingTransition.style}>
            <LoadingState />
          </MotionView>
        }
      >
        <MotionView key={currentView} style={animations.pageTransition.style}>
          {currentView === 'discover' && <DiscoverView />}
          {currentView === 'matches' && (
            <MatchesView onNavigateToChat={() => { navigation.navigateToView('chat') }} />
          )}
          {currentView === 'chat' && <ChatView />}
          {currentView === 'community' && <CommunityView />}
          {currentView === 'adoption' && <AdoptionView />}
          {currentView === 'lost-found' && <LostFoundView />}
          {currentView === 'profile' && <ProfileView />}
        </MotionView>
      </Suspense>
    </main>
  )
}

