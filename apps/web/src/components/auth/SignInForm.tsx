import { motion } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'
import { useSignInForm } from './hooks/useSignInForm'
import { SignInFormHeader } from './components/SignInFormHeader'
import { SignInFormFields } from './components/SignInFormFields'
import { SignInFormFooter } from './components/SignInFormFooter'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { getSpacingClassesFromConfig } from '@/lib/typography'

function createFormVariants(shouldReduceMotion: boolean): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }
    }
  };
}

interface SignInFormProps {
  onSuccess: () => void
  onSwitchToSignUp: () => void
}

export default function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const { t } = useApp()
  const shouldReduceMotion = useReducedMotion()
  const {
    email,
    password,
    showPassword,
    errors,
    isLoading,
    formFieldHandlers,
    handleSubmit,
    handleForgotPassword,
    handleLegalClick,
    handleOAuthClick,
  } = useSignInForm(t, onSuccess)

  return (
    <motion.div variants={createFormVariants(shouldReduceMotion)} initial="hidden" animate="visible">
      <SignInFormHeader t={t} />
      <form onSubmit={(e) => void handleSubmit(e)} className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
        <SignInFormFields
          email={email}
          password={password}
          showPassword={showPassword}
          errors={errors}
          isLoading={isLoading}
          t={t}
          {...formFieldHandlers}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          className="w-full rounded-xl"
          onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
        >
          {isLoading ? (t.common.loading ?? 'Loading...') : (t.auth?.signIn ?? 'Sign In')}
        </Button>
        <SignInFormFooter
          t={t}
          isLoading={isLoading}
          onForgotPassword={handleForgotPassword}
          onOAuthClick={handleOAuthClick}
          onSwitchToSignUp={onSwitchToSignUp}
          onLegalClick={handleLegalClick}
        />
      </form>
    </motion.div>
  );
}
