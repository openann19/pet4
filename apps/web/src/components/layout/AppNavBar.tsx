import { MotionView } from "@petspark/motion";
/**
 * AppNavBar Component
 *
 * Bottom navigation bar with view switching buttons.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { Sparkle, Heart, ChatCircle, Users, User, MapPin } from '@phosphor-icons/react';
import { NavButton } from '@/components/navigation/NavButton';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';
import type { View } from '@/lib/routes';
import { haptics } from '@/lib/haptics';

interface AppNavBarProps {
  currentView: View;
  translations: {
    nav: {
      discover: string;
      matches: string;
      chat: string;
      community: string;
      adoption: string;
      'lost-found': string;
      profile: string;
    };
  };
  animations: UseAppAnimationsReturn;
  onViewChange: (view: View) => void;
}

const NAV_BUTTON_BASE_CLASSES =
  'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]';

export function AppNavBar({
  currentView,
  translations,
  animations,
  onViewChange,
}: AppNavBarProps): JSX.Element {
  const { navBarAnimation, lostFoundAnimation } = animations;

  return (
    <MotionView
      style={navBarAnimation.navStyle}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"
    >
      <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />
      <MotionView
        style={navBarAnimation.shimmerStyle}
        className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
        <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
          <NavButton
            isActive={currentView === 'discover'}
            onClick={() => onViewChange('discover')}
            icon={<Sparkle size={22} weight={currentView === 'discover' ? 'fill' : 'regular'} />}
            label={translations.nav.discover}
            enablePulse={currentView === 'discover'}
            enableIconAnimation={true}
          />

          <NavButton
            isActive={currentView === 'matches'}
            onClick={() => onViewChange('matches')}
            icon={<Heart size={22} weight={currentView === 'matches' ? 'fill' : 'regular'} />}
            label={translations.nav.matches}
            enablePulse={currentView === 'matches'}
          />

          <NavButton
            isActive={currentView === 'chat'}
            onClick={() => onViewChange('chat')}
            icon={<ChatCircle size={22} weight={currentView === 'chat' ? 'fill' : 'regular'} />}
            label={translations.nav.chat}
            enablePulse={currentView === 'chat'}
          />

          <NavButton
            isActive={currentView === 'community'}
            onClick={() => onViewChange('community')}
            icon={<Users size={22} weight={currentView === 'community' ? 'fill' : 'regular'} />}
            label={translations.nav.community}
            enablePulse={currentView === 'community'}
          />

          <NavButton
            isActive={currentView === 'adoption'}
            onClick={() => onViewChange('adoption')}
            icon={<Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />}
            label={translations.nav.adoption}
            enablePulse={currentView === 'adoption'}
          />

          <MotionView
            className={`${NAV_BUTTON_BASE_CLASSES} relative cursor-pointer ${
              currentView === 'lost-found'
                ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            variants={lostFoundAnimation.variants}
            initial={'initial' as const}
            animate={'animate' as const}
            onMouseEnter={lostFoundAnimation.handleHover}
            onMouseLeave={lostFoundAnimation.handleLeave}
            onClick={() => {
              lostFoundAnimation.handlePress();
              haptics.impact('light');
              onViewChange('lost-found');
            }}
          >
            <MotionView variants={lostFoundAnimation.iconVariants} initial={'initial' as const} animate={'animate' as const}>
              <MapPin size={22} weight={currentView === 'lost-found' ? 'fill' : 'regular'} />
            </MotionView>
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">
              {translations.nav['lost-found']}
            </span>
            {currentView === 'lost-found' && (
              <MotionView
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                variants={lostFoundAnimation.indicatorVariants}
                initial={'initial' as const}
                animate={'animate' as const}
              >
                <div />
              </MotionView>
            )}
          </MotionView>

          <NavButton
            isActive={currentView === 'profile'}
            onClick={() => onViewChange('profile')}
            icon={<User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />}
            label={translations.nav.profile}
            enablePulse={currentView === 'profile'}
          />
        </div>
      </div>
    </MotionView>
  );
}

