import React, { useCallback } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import SignUpForm from '../components/auth/SignUpForm.native'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('SignUpScreen')

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>

function SignUpScreenContent({ navigation }: SignUpScreenProps): React.JSX.Element {
  const handleSuccess = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    })
  }, [navigation])

  const handleSwitchToSignIn = useCallback(() => {
    navigation.replace('SignIn')
  }, [navigation])

  return <SignUpForm onSuccess={handleSuccess} onSwitchToSignIn={handleSwitchToSignIn} />
}

export default function SignUpScreen(props: SignUpScreenProps): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('SignUpScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <SignUpScreenContent {...props} />
    </RouteErrorBoundary>
  )
}
