import type { AppContextType } from '@/contexts/AppContext';
import { useSignInFormState } from './useSignInFormState';
import { useSignInFormHandlers } from './useSignInFormHandlers';

export function useSignInForm(
  t: AppContextType['t'],
  onSuccess: () => void
) {
  const state = useSignInFormState(t, onSuccess);
  const handlers = useSignInFormHandlers({
    t,
    email: state.email,
    password: state.password,
    validateForm: state.validateForm,
    submitSignIn: state.submitSignIn,
  });

  return {
    ...state,
    ...handlers,
  };
}

