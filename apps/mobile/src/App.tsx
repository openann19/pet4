import { AppNavigator } from '@mobile/navigation/AppNavigator'
import { colors } from '@mobile/theme/colors'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.card} />
      <AppNavigator />
    </SafeAreaProvider>
  )
}
