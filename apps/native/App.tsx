import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from './src/screens/DiscoverScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdoptionScreen from './src/screens/AdoptionScreen';
import LostFoundScreen from './src/screens/LostFoundScreen';
import { AdminConsoleScreen } from './src/screens/AdminConsoleScreen';
import PetDetailScreen from './src/screens/PetDetailScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MapScreen from './src/screens/MapScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SavedPostsScreen from './src/screens/SavedPostsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { CallScreen } from './src/screens/CallScreen';
import PlaydatesScreen from './src/screens/PlaydatesScreen';
import DataInitializer from './src/components/DataInitializer';
import { useStorage } from './src/hooks/use-storage';
import { BusinessConfigScreen } from './src/screens/admin/BusinessConfigScreen';
import { MatchingConfigScreen } from './src/screens/admin/MatchingConfigScreen';
import { MapSettingsScreen } from './src/screens/admin/MapSettingsScreen';
import { APIConfigScreen } from './src/screens/admin/APIConfigScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF715B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#FF715B',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: 'Discover',
          tabBarLabel: 'Discover',
          tabBarIcon: () => '🔍',
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Matches',
          tabBarLabel: 'Matches',
          tabBarIcon: () => '💝',
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: 'Chats',
          tabBarLabel: 'Chats',
          tabBarIcon: () => '💬',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: () => '👥',
        }}
      />
      <Tab.Screen
        name="Adoption"
        component={AdoptionScreen}
        options={{
          title: 'Adoption',
          tabBarLabel: 'Adoption',
          tabBarIcon: () => '🏠',
        }}
      />
      <Tab.Screen
        name="LostFound"
        component={LostFoundScreen}
        options={{
          title: 'Lost & Found',
          tabBarLabel: 'Lost',
          tabBarIcon: () => '🔍',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => '👤',
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminConsoleScreen}
        options={{
          title: 'Admin Console',
          tabBarLabel: 'Admin',
          tabBarIcon: () => '⚙️',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App(): React.JSX.Element {
  const [isAuthenticated] = useStorage('is-authenticated', false);

  return (
    <>
      <DataInitializer />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                  headerShown: true,
                  title: 'Chat',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="PetDetail"
                component={PetDetailScreen}
                options={{
                  headerShown: true,
                  title: 'Pet Details',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="Map"
                component={MapScreen}
                options={{
                  headerShown: true,
                  title: 'Map',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                  headerShown: true,
                  title: 'Notifications',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="SavedPosts"
                component={SavedPostsScreen}
                options={{
                  headerShown: true,
                  title: 'Saved Posts',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerShown: true,
                  title: 'Settings',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="Call"
                component={CallScreen}
                options={{
                  headerShown: false,
                  presentation: 'fullScreenModal',
                }}
              />
              <Stack.Screen
                name="Playdates"
                component={PlaydatesScreen}
                options={{
                  headerShown: true,
                  title: 'Playdates',
                  headerStyle: {
                    backgroundColor: '#FF715B',
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen
                name="BusinessConfig"
                component={BusinessConfigScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="MatchingConfig"
                component={MatchingConfigScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="MapSettings"
                component={MapSettingsScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="APIConfig"
                component={APIConfigScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
