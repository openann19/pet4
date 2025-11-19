import { useState } from 'react';
import { ArrowLeft, Translate } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/enhanced/buttons/SegmentedControl';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { motion, type Variants } from '@petspark/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';
import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig } from '@/lib/typography';

type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AuthScreen({ initialMode = 'signup', onBack, onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { t, language, toggleLanguage } = useApp();
  const shouldReduceMotion = useReducedMotion();

  // Animation variants using Framer Motion
  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { 
            type: 'spring', 
            damping: 20, 
            stiffness: 300 
          }
    }
  };

  const formVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.2 }
    }
  };

  const handleModeSwitch = (newMode: string | string[]) => {
    if (typeof newMode === 'string') {
      setMode(newMode as AuthMode);
    }
  };

  const handleBack = () => {
    haptics.trigger('light');
    onBack();
  };

  const handleLanguageToggle = () => {
    haptics.trigger('selection');
    toggleLanguage();
  };

  return (
    <main 
      className="fixed inset-0 bg-background overflow-auto"
      aria-label="Authentication"
    >
      <div className="min-h-screen flex flex-col">
        {/* Header with back button, mode switcher, and language toggle */}
        <header
          className={cn(
            'flex items-center justify-between',
            getSpacingClassesFromConfig({ padding: 'lg' })
          )}
          aria-label="Authentication header"
        >
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            className="contents"
          >
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={() => void handleBack()}
            aria-label={t.common.back}
            className="w-10 h-10 p-0"
          >
            <ArrowLeft size={20} />
          </Button>

          <SegmentedControl
            options={[
              { label: t.auth?.signIn || 'Sign In', value: 'signin' },
              { label: t.auth?.signUp || 'Sign Up', value: 'signup' }
            ]}
            value={mode}
            onChange={(value) => void handleModeSwitch(value)}
            aria-label="Authentication mode"
          />

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={() => void handleLanguageToggle()}
            aria-pressed={language === 'bg'}
            aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
            className="w-10 h-10 p-0"
          >
            <Translate size={20} aria-hidden="true" />
          </Button>
          </motion.div>
        </header>

        <section 
          className={cn(
            'flex-1 flex items-center justify-center',
            getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'xl' })
          )}
          aria-label="Authentication form"
        >
          <div className="w-full max-w-md">
            <motion.div
              key={mode}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {mode === 'signin' ? (
                <SignInForm
                  onSuccess={onSuccess}
                  onSwitchToSignUp={() => { handleModeSwitch('signup'); }}
                />
              ) : (
                <SignUpForm
                  onSuccess={onSuccess}
                  onSwitchToSignIn={() => { handleModeSwitch('signin'); }}
                />
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
