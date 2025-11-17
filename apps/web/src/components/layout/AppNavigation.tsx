/**
 * App Navigation Component
 * Bottom navigation bar with view switching
 */

import { MotionView, useSharedValue } from '@petspark/motion'
import { NavButton } from '@/components/navigation/NavButton'
import {
  Sparkle,
  Heart,
  ChatCircle,
  Users,
  MapPin,
  User,
} from '@phosphor-icons/react'
import { haptics } from '@/lib/haptics'
import type { View } from '@/lib/routes'

interface AppNavigationProps {
  currentView: View
  setCurrentView: (view: View) => void
  animations: {
    navBarAnimation: {
      navStyle: React.CSSProperties
      shimmerStyle: React.CSSProperties
    }
    lostFoundAnimation: {
      scale: number | ReturnType<typeof useSharedValue<number>>
      translateY: number | ReturnType<typeof useSharedValue<number>>
      iconScale: number | ReturnType<typeof useSharedValue<number>>
      iconRotation: number | ReturnType<typeof useSharedValue<number>>
      indicatorOpacity: number | ReturnType<typeof useSharedValue<number>>
      indicatorWidth: number | ReturnType<typeof useSharedValue<number>>
      handleHover: () => void
      handleLeave: () => void
      handlePress: () => void
    }
  }
  t: {
    nav: {
      discover: string
      matches: string
      chat: string
      community?: string
      adoption?: string
      'lost-found'?: string
      profile: string
    }
  }
  NAV_BUTTON_BASE_CLASSES: string
}

export function AppNavigation({
  currentView,
  setCurrentView,
  animations,
  t,
  NAV_BUTTON_BASE_CLASSES,
}: AppNavigationProps) {
  return (
    <MotionView
      style={animations.navBarAnimation.navStyle}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"
    >
      <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />
      <MotionView
        style={animations.navBarAnimation.shimmerStyle}
        className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
        <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
          <NavButton
            isActive={currentView === 'discover'}
            onClick={() => {
              setCurrentView('discover')
            }}
            icon={<Sparkle size={22} weight={currentView === 'discover' ? 'fill' : 'regular'} />}
            label={t.nav.discover}
            enablePulse={currentView === 'discover'}
            enableIconAnimation={true}
          />

          <NavButton
            isActive={currentView === 'matches'}
            onClick={() => {
              setCurrentView('matches')
            }}
            icon={<Heart size={22} weight={currentView === 'matches' ? 'fill' : 'regular'} />}
            label={t.nav.matches}
            enablePulse={currentView === 'matches'}
          />

          <NavButton
            isActive={currentView === 'chat'}
            onClick={() => {
              setCurrentView('chat')
            }}
            icon={<ChatCircle size={22} weight={currentView === 'chat' ? 'fill' : 'regular'} />}
            label={t.nav.chat}
            enablePulse={currentView === 'chat'}
          />

          <NavButton
            isActive={currentView === 'community'}
            onClick={() => {
              setCurrentView('community')
            }}
            icon={<Users size={22} weight={currentView === 'community' ? 'fill' : 'regular'} />}
            label={t.nav.community ?? 'Community'}
            enablePulse={currentView === 'community'}
          />

          <NavButton
            isActive={currentView === 'adoption'}
            onClick={() => {
              setCurrentView('adoption')
            }}
            icon={<Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />}
            label={t.nav.adoption ?? 'Adopt'}
            enablePulse={currentView === 'adoption'}
          />

          <MotionView
            className={`${String(NAV_BUTTON_BASE_CLASSES ?? '')} relative cursor-pointer ${
              String(
                currentView === 'lost-found'
                  ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )
            }`}
            style={{
              scale: animations.lostFoundAnimation.scale,
              y: animations.lostFoundAnimation.translateY,
            }}
            onMouseEnter={animations.lostFoundAnimation.handleHover}
            onMouseLeave={animations.lostFoundAnimation.handleLeave}
            onClick={() => {
              animations.lostFoundAnimation.handlePress()
              haptics.impact('light')
              setCurrentView('lost-found')
            }}
          >
            <MotionView
              style={{
                scale: animations.lostFoundAnimation.iconScale,
                rotate: animations.lostFoundAnimation.iconRotation,
              }}
            >
              <MapPin size={22} weight={currentView === 'lost-found' ? 'fill' : 'regular'} />
            </MotionView>
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">
              {t.nav['lost-found'] ?? 'Lost & Found'}
            </span>
            {currentView === 'lost-found' && (
              <MotionView
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                style={{
                  opacity: animations.lostFoundAnimation.indicatorOpacity,
                  width: animations.lostFoundAnimation.indicatorWidth,
                }}
              >
                <div />
              </MotionView>
            )}
          </MotionView>

          <NavButton
            isActive={currentView === 'profile'}
            onClick={() => {
              setCurrentView('profile')
            }}
            icon={<User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />}
            label={t.nav.profile}
            enablePulse={currentView === 'profile'}
          />
        </div>
      </div>
    </MotionView>
  )
}

