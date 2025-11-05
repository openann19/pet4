import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useColorScheme, Text } from 'react-native'
import type { RootTabParamList } from '@mobile/navigation/types'
import { HomeScreen } from '@mobile/screens/HomeScreen'
import { AdoptionScreen } from '@mobile/screens/AdoptionScreen'
import { CommunityScreen } from '@mobile/screens/CommunityScreen'
import { MatchingScreen } from '@mobile/screens/MatchingScreen'
import { ProfileScreen } from '@mobile/screens/ProfileScreen'
import { colors } from '@mobile/theme/colors'

const Tab = createBottomTabNavigator<RootTabParamList>()

export function AppNavigator() {
  const colorScheme = useColorScheme()

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card
          },
          headerTintColor: colors.textPrimary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>●</Text>,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          },
          tabBarHideOnKeyboard: true,
          headerTitleStyle: {
            fontWeight: '700'
          }
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Adoption" component={AdoptionScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Matching" component={MatchingScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
