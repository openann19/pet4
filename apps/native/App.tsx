import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from './src/screens/DiscoverScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdoptionScreen from './src/screens/AdoptionScreen';
import LostFoundScreen from './src/screens/LostFoundScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DataInitializer from './src/components/DataInitializer';
import { useStorage } from './src/hooks/useStorage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#999',
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
                    backgroundColor: '#6366f1',
                  },
                  headerTintColor: '#fff',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
