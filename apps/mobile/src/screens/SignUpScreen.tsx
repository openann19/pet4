import React, { useCallback } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import SignUpForm from '../components/auth/SignUpForm.native'
import type { RootStackParamList } from '../navigation/AppNavigator'

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>

export default function SignUpScreen({ navigation }: SignUpScreenProps): React.JSX.Element {
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
