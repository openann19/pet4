import { UploadAndEditScreen } from '@mobile/components/media-editor/UploadAndEditScreen'
import { EnhancedTabNavigator } from '@mobile/navigation/EnhancedTabNavigator'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { useColorScheme } from 'react-native'
import { linking } from './linking'
import { SignInForm } from '@ui-mobile'
import { PostComposer } from '@ui-mobile'
import SignUpScreen from '@mobile/screens/SignUpScreen'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  MainTabs: undefined
  UploadAndEdit: { onDone: (uri: string) => void; onCancel?: () => void }
  SignIn: undefined
  SignUp: undefined
  PostComposer: { onPostCreated?: () => void } | undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>
type PostComposerScreenProps = NativeStackScreenProps<RootStackParamList, 'PostComposer'>

function SignInScreen({ navigation }: SignInScreenProps): React.JSX.Element {
  return (
    <SignInForm
      onSuccess={() => {
        navigation.replace('MainTabs')
      }}
      onSwitchToSignUp={() => {
        navigation.navigate('SignUp')
      }}
    />
  )
}

function PostComposerScreen({ navigation, route }: PostComposerScreenProps): React.JSX.Element {
  return (
    <PostComposer
      open={true}
      onOpenChange={(open: boolean) => {
        if (!open) navigation.goBack()
      }}
      onPostCreated={route.params?.onPostCreated}
    />
  )
}

export function AppNavigator(): React.JSX.Element {
  const colorScheme = useColorScheme()

  return (
    <NavigationContainer
      linking={linking}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={EnhancedTabNavigator} />
        <Stack.Screen
          name="UploadAndEdit"
          component={UploadAndEditScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Upload & Edit',
          }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{
            headerShown: true,
            title: 'Sign In',
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            headerShown: true,
            title: 'Sign Up',
          }}
        />
        <Stack.Screen
          name="PostComposer"
          component={PostComposerScreen}
          options={{
            headerShown: true,
            title: 'Create Post',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
