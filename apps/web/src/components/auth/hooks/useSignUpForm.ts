import type { AppContextType } from '@/contexts/AppContext';
import { useSignUpFormState } from './useSignUpFormState';
import { useSignUpFormHandlers } from './useSignUpFormHandlers';

export function useSignUpForm(
  t: AppContextType['t'],
  onSuccess: () => void
) {
  const state = useSignUpFormState(t, onSuccess);
  const handlers = useSignUpFormHandlers({
    t,
    ageVerified: state.ageVerified,
    agreeToTerms: state.agreeToTerms,
    name: state.name,
    email: state.email,
    password: state.password,
    confirmPassword: state.confirmPassword,
    validateForm: state.validateForm,
    submitSignUp: state.submitSignUp,
    setShowAgeGate: state.setShowAgeGate,
    setAgeVerified: state.setAgeVerified,
    onSuccess,
  });

  return {
    ...state,
    ...handlers,
  };
}

