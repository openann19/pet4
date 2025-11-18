import { MotionView } from '@petspark/motion';
import { lazy, Suspense } from 'react';
import { Heart, Sun, Moon, Palette, ShieldCheck, Translate } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

const SyncStatusIndicator = lazy(() => import('@/components/SyncStatusIndicator').then(module => ({ default: module.SyncStatusIndicator })));
const PremiumNotificationBell = lazy(() => import('@/components/notifications/PremiumNotificationBell').then(module => ({ default: module.PremiumNotificationBell })));

export interface AppHeaderProps {
  t: { app: { title: string } };
  theme: 'light' | 'dark';
  language: 'en' | 'bg';
  animations: UseAppAnimationsReturn;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenAdminConsole: () => void;
  onOpenThemeSettings: () => void;
}

export function AppHeader({
  t,
  theme,
  language,
  animations,
  onToggleTheme,
  onToggleLanguage,
  onOpenAdminConsole,
  onOpenThemeSettings,
}: AppHeaderProps) {
  return (
    <MotionView 
      className="backdrop-blur-2xl bg-card/90 border-b border-border/50 sticky top-0 z-40 shadow-2xl shadow-primary/20"
      style={animations.headerAnimation.headerStyle}
    >
      <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-accent/8 to-secondary/8 pointer-events-none" />
      <MotionView 
        className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
        style={animations.headerAnimation.shimmerStyle}
      >
        <div />
      </MotionView>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <MotionView 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            style={{ scale: animations.logoButtonHover.scale, y: animations.logoButtonHover.translateY }}
            onMouseEnter={animations.logoButtonHover.handleEnter}
            onMouseLeave={animations.logoButtonHover.handleLeave}
          >
            <MotionView className="relative" style={animations.logoAnimation.style}>
              <MotionView
                className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl"
                style={animations.logoGlow.style}
              >
                <div />
              </MotionView>
              <Heart className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300" size={24} weight="fill" />
            </MotionView>
            <h1 className="text-base sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-x drop-shadow-sm">
              {t.app.title}
            </h1>
          </MotionView>
          <MotionView 
            className="flex items-center gap-1 sm:gap-2"
            style={{ opacity: animations.headerButtonsContainer.opacity, x: animations.headerButtonsContainer.x }}
          >
            <MotionView 
              style={animations.headerButton1.buttonStyle}
              onMouseEnter={animations.headerButton1.handleEnter}
              onMouseLeave={animations.headerButton1.handleLeave}
              onClick={animations.headerButton1.handleTap}
            >
              <Suspense fallback={<div className="w-9 h-9" />}>
                <SyncStatusIndicator />
              </Suspense>
            </MotionView>
            <MotionView 
              style={animations.headerButton2.buttonStyle}
              onMouseEnter={animations.headerButton2.handleEnter}
              onMouseLeave={animations.headerButton2.handleLeave}
              onClick={animations.headerButton2.handleTap}
            >
              <Suspense fallback={<div className="w-9 h-9" />}>
                <PremiumNotificationBell />
              </Suspense>
            </MotionView>
            <MotionView 
              style={animations.headerButton3.buttonStyle}
              onMouseEnter={animations.headerButton3.handleEnter}
              onMouseLeave={animations.headerButton3.handleLeave}
              onClick={animations.headerButton3.handleTap}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void onToggleLanguage()}
                className="rounded-full h-9 px-3 hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
                aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
                aria-pressed={language === 'bg'}
                title={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
              >
                <MotionView style={animations.languageIconRotation.style}>
                  <Translate size={18} weight="bold" className="text-foreground" />
                </MotionView>
                <span className="text-xs font-semibold">
                  {language === 'en' ? 'БГ' : 'EN'}
                </span>
              </Button>
            </MotionView>
            <MotionView 
              style={animations.headerButton4.buttonStyle}
              onMouseEnter={animations.headerButton4.handleEnter}
              onMouseLeave={animations.headerButton4.handleLeave}
              onClick={animations.headerButton4.handleTap}
            >
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onClick={() => void onOpenAdminConsole()}
                className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 w-10 h-10 p-0"
                aria-label="Admin Console"
                title="Admin Console"
              >
                <ShieldCheck size={20} weight="bold" className="text-foreground" />
              </Button>
            </MotionView>
            <MotionView 
              style={animations.headerButton5.buttonStyle}
              onMouseEnter={animations.headerButton5.handleEnter}
              onMouseLeave={animations.headerButton5.handleLeave}
              onClick={animations.headerButton5.handleTap}
            >
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onClick={() => void onToggleTheme()}
                className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 w-10 h-10 p-0"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun size={20} weight="bold" className="text-foreground" />
                ) : (
                  <Moon size={20} weight="bold" className="text-foreground" />
                )}
              </Button>
            </MotionView>
            <MotionView 
              style={animations.headerButton6.buttonStyle}
              onMouseEnter={animations.headerButton6.handleEnter}
              onMouseLeave={animations.headerButton6.handleLeave}
              onClick={animations.headerButton6.handleTap}
            >
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onClick={() => void onOpenThemeSettings()}
                className="rounded-full hover:bg-primary/15 active:bg-primary/25 transition-all duration-300 shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Theme Settings"
                title="Ultra Theme Settings"
              >
                <Palette size={20} weight="bold" className="text-foreground" />
              </Button>
            </MotionView>
          </MotionView>
        </div>
      </div>
    </MotionView>
  );
}

