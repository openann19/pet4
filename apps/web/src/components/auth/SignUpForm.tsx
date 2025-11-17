import { motion, type Variants } from '@petspark/motion'
import { useApp } from '@/contexts/AppContext'
import AgeGateModal from './AgeGateModal'
import { useSignUpForm } from './hooks/useSignUpForm'
import { SignUpFormHeader } from './components/SignUpFormHeader'
import { SignUpFormBody } from './components/SignUpFormBody'
import { useReducedMotion } from '@/hooks/useReducedMotion'

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

interface SignUpFormProps {
  onSuccess: () => void
  onSwitchToSignIn: () => void
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { t } = useApp()
  const shouldReduceMotion = useReducedMotion()
  const {
    name,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    agreeToTerms,
    showAgeGate,
    errors,
    isLoading,
    formFieldHandlers,
    handleSubmit,
    handleAgeVerified,
    handleOAuthSuccess,
    setShowAgeGate,
  } = useSignUpForm(t, onSuccess)

  return (
    <motion.div variants={createFormVariants(shouldReduceMotion)} initial="hidden" animate="visible">
      <SignUpFormHeader t={t} />
      <SignUpFormBody
        name={name}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        agreeToTerms={agreeToTerms}
        errors={errors}
        isLoading={isLoading}
        shouldReduceMotion={shouldReduceMotion}
        t={t}
        formFieldHandlers={formFieldHandlers}
        onOAuthSuccess={handleOAuthSuccess}
        onSwitchToSignIn={onSwitchToSignIn}
        onSubmit={(e) => void handleSubmit(e)}
      />
      <AgeGateModal
        open={showAgeGate}
        onVerified={handleAgeVerified}
        onClose={() => { setShowAgeGate(false); }}
      />
    </motion.div>
  );
}
