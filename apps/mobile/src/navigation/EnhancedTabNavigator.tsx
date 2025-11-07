/**
 * Enhanced Bottom Tab Navigator with haptics, animations, and proper icons
 * Location: src/navigation/EnhancedTabNavigator.tsx
 */

import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import React, { useCallback } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabBarIcon } from '../components/navigation/TabBarIcon'
import { AdoptScreen } from '../screens/AdoptScreen'
import { ChatScreen } from '../screens/ChatScreen'
import { CommunityScreen } from '../screens/CommunityScreen'
import { FeedScreen } from '../screens/FeedScreen'
import { MatchesScreen } from '../screens/MatchesScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { colors } from '../theme/colors'
import type { RootTabParamList } from './types'

const Tab = createBottomTabNavigator<RootTabParamList>()

// Icon mapping for each tab
const TAB_ICONS: Record<keyof RootTabParamList, string> = {
  Feed: '🧭',
  Chat: '💬',
  Matches: '❤️',
  Adopt: '🐾',
  Community: '👥',
  Profile: '👤',
}

export function EnhancedTabNavigator(): React.JSX.Element {
  const insets = useSafeAreaInsets()

  // Add haptic feedback on tab change
  const handleTabPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const screenOptions: BottomTabNavigationOptions = {
    headerStyle: {
      backgroundColor: colors.card,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 18,
    },
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 60 + insets.bottom,
      paddingBottom: insets.bottom,
      paddingTop: 8,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
    tabBarHideOnKeyboard: true,
  }

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Feed} />
          ),
          title: 'Discover',
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Chat} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Matches} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Adopt" 
        component={AdoptScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Adopt} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Community} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} icon={TAB_ICONS.Profile} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tab.Navigator>
  )
}


