import { MotionView } from '@petspark/motion';
import { Heart, ChatCircle, Users, Sparkle, MapPin, User } from '@phosphor-icons/react';
import { NavButton } from '@/components/navigation/NavButton';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

export interface AppNavBarProps {
  currentView: string;
  t: { nav: Record<string, string> };
  animations: UseAppAnimationsReturn;
  onNavigate: (view: string) => void;
}

const NAV_BUTTON_BASE_CLASSES = 'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px]';

export function AppNavBar({
  currentView,
  t,
  animations,
  onNavigate,
}: AppNavBarProps) {
  return (
    <MotionView 
      animatedStyle={animations.navBarAnimation.navStyle}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/50 z-40 shadow-2xl shadow-primary/20 safe-area-inset-bottom"                                                                               
    >
      <div className="absolute inset-0 bg-linear-to-t from-primary/8 via-accent/4 to-transparent pointer-events-none" />                                      
      <MotionView 
        animatedStyle={animations.navBarAnimation.shimmerStyle}
        className="absolute inset-0 bg-linear-to-r from-transparent via-accent/5 to-transparent pointer-events-none"                                          
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-1 sm:px-2 relative">
        <div className="flex items-center justify-around py-2 sm:py-3 gap-1">
          <NavButton
            isActive={currentView === 'discover'}
            onClick={() => onNavigate('discover')}
            icon={<Sparkle size={22} weight={currentView === 'discover' ? 'fill' : 'regular'} />}
            label={t.nav.discover ?? 'Discover'}
            enablePulse={currentView === 'discover'}
            enableIconAnimation={true}
          />

          <NavButton
            isActive={currentView === 'matches'}
            onClick={() => onNavigate('matches')}
            icon={<Heart size={22} weight={currentView === 'matches' ? 'fill' : 'regular'} />}
            label={t.nav.matches ?? 'Matches'}
            enablePulse={currentView === 'matches'}
          />

          <NavButton
            isActive={currentView === 'chat'}
            onClick={() => onNavigate('chat')}
            icon={<ChatCircle size={22} weight={currentView === 'chat' ? 'fill' : 'regular'} />}
            label={t.nav.chat ?? 'Chat'}
            enablePulse={currentView === 'chat'}
          />

          <NavButton
            isActive={currentView === 'community'}
            onClick={() => onNavigate('community')}
            icon={<Users size={22} weight={currentView === 'community' ? 'fill' : 'regular'} />}
            label={t.nav.community ?? 'Community'}
            enablePulse={currentView === 'community'}
          />

          <NavButton
            isActive={currentView === 'adoption'}
            onClick={() => onNavigate('adoption')}
            icon={<Heart size={22} weight={currentView === 'adoption' ? 'fill' : 'duotone'} />}
            label={t.nav.adoption ?? 'Adopt'}
            enablePulse={currentView === 'adoption'}
          />

          <MotionView
            className={`${String(NAV_BUTTON_BASE_CLASSES ?? '')} relative cursor-pointer ${
              String(currentView === 'lost-found'
                ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60')
            }`}
            animatedStyle={{ scale: animations.lostFoundAnimation.scale, y: animations.lostFoundAnimation.translateY }}
            onMouseEnter={animations.lostFoundAnimation.handleHover}
            onMouseLeave={animations.lostFoundAnimation.handleLeave}
            onClick={() => {
              animations.lostFoundAnimation.handlePress();
              onNavigate('lost-found');
            }}
          >
            <MotionView animatedStyle={{ scale: animations.lostFoundAnimation.iconScale, rotate: animations.lostFoundAnimation.iconRotation }}>
              <MapPin size={22} weight={currentView === 'lost-found' ? 'fill' : 'regular'} />
            </MotionView>
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">{t.nav['lost-found'] ?? 'Lost & Found'}</span>
            {currentView === 'lost-found' && (
              <MotionView
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
                animatedStyle={{ opacity: animations.lostFoundAnimation.indicatorOpacity, width: animations.lostFoundAnimation.indicatorWidth }}
              >
                <div />
              </MotionView>
            )}
          </MotionView>

          <NavButton
            isActive={currentView === 'profile'}
            onClick={() => onNavigate('profile')}
            icon={<User size={22} weight={currentView === 'profile' ? 'fill' : 'regular'} />}
            label={t.nav.profile ?? 'Profile'}
            enablePulse={currentView === 'profile'}
          />
        </div>
      </div>
    </MotionView>
  );
}

