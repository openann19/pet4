/**
 * Mobile Screen Discovery Script
 * Discovers all screens in the React Native mobile application
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ScreenInfo {
  name: string;
  component: string;
  navigator: 'AppNavigator' | 'RootShell' | 'EnhancedTabNavigator';
  isModal: boolean;
  isTab: boolean;
  stack?: string;
  description?: string;
}

interface ScreenMatrix {
  screens: ScreenInfo[];
  platforms: string[];
  themes: string[];
  fontScales: string[];
  states: string[];
}

const APP_NAVIGATOR_PATH = join(process.cwd(), 'apps/mobile/src/navigation/AppNavigator.tsx');
const ROOT_SHELL_PATH = join(process.cwd(), 'apps/mobile/src/navigation/RootShell.tsx');
const ENHANCED_TAB_NAVIGATOR_PATH = join(process.cwd(), 'apps/mobile/src/navigation/EnhancedTabNavigator.tsx');
const OUTPUT_PATH = join(process.cwd(), 'scripts/ui-audit/mobile-screens.json');

function discoverScreens(): ScreenMatrix {
  const screens: ScreenInfo[] = [];

  // Discover screens from AppNavigator
  try {
    const appNavigatorContent = readFileSync(APP_NAVIGATOR_PATH, 'utf-8');

    // Extract Stack.Screen components
    const stackScreenMatches = appNavigatorContent.matchAll(
      /<Stack\.Screen\s+name="([^"]+)"[^>]*>/g
    );

    for (const match of stackScreenMatches) {
      const name = match[1];
      const isModal = appNavigatorContent.includes(`name="${name}"`) &&
                     appNavigatorContent.includes("presentation: 'modal'");

      // Extract component name
      let component = name;
      const componentMatch = appNavigatorContent.match(
        new RegExp(`name="${name}"[^>]*>\\s*component=\\{([A-Za-z]+)`, 's')
      );
      if (componentMatch) {
        component = componentMatch[1];
      }

      screens.push({
        name,
        component,
        navigator: 'AppNavigator',
        isModal,
        isTab: false,
        stack: 'RootStack',
      });
    }
  } catch {
    // File might not exist, continue
  }

  // Discover screens from RootShell
  try {
    const rootShellContent = readFileSync(ROOT_SHELL_PATH, 'utf-8');

    // Extract tab keys from BottomNavBar items
    const tabMatches = rootShellContent.matchAll(
      /\{ key: '([^']+)', label: '[^']+' \}/g
    );

    for (const match of tabMatches) {
      const key = match[1];
      const componentMap: Record<string, string> = {
        feed: 'HomeScreen',
        community: 'CommunityScreen',
        chat: 'ChatScreen',
        adopt: 'AdoptScreen',
        matches: 'MatchesScreen',
        profile: 'ProfileScreen',
      };

      screens.push({
        name: key,
        component: componentMap[key] || `${key.charAt(0).toUpperCase() + key.slice(1)}Screen`,
        navigator: 'RootShell',
        isModal: false,
        isTab: true,
      });
    }
  } catch {
    // File might not exist, continue
  }

  // Discover screens from EnhancedTabNavigator
  try {
    const enhancedTabContent = readFileSync(ENHANCED_TAB_NAVIGATOR_PATH, 'utf-8');

    // Extract Tab.Screen components
    const tabScreenMatches = enhancedTabContent.matchAll(
      /<Tab\.Screen\s+name="([^"]+)"[^>]*>/g
    );

    for (const match of tabScreenMatches) {
      const name = match[1];

      // Extract component name
      let component = name;
      const componentMatch = enhancedTabContent.match(
        new RegExp(`name="${name}"[^>]*>\\s*component=\\{([A-Za-z]+)`, 's')
      );
      if (componentMatch) {
        component = componentMatch[1];
      }

      // Check if already added
      if (!screens.some(s => s.name === name && s.navigator === 'EnhancedTabNavigator')) {
        screens.push({
          name,
          component,
          navigator: 'EnhancedTabNavigator',
          isModal: false,
          isTab: true,
        });
      }
    }
  } catch {
    // File might not exist, continue
  }

  // Remove duplicates
  const uniqueScreens = Array.from(
    new Map(screens.map(screen => [`${screen.navigator}-${screen.name}`, screen])).values()
  );

  return {
    screens: uniqueScreens,
    platforms: ['ios', 'android'],
    themes: ['light', 'dark'],
    fontScales: ['default', 'large'],
    states: ['idle', 'focus', 'error', 'empty'],
  };
}

function generateScreenMatrix(matrix: ScreenMatrix): void {
  const totalCombinations =
    matrix.screens.length *
    matrix.platforms.length *
    matrix.themes.length *
    matrix.fontScales.length *
    matrix.states.length;

  console.log('Mobile Screen Discovery Results:');
  console.log(`Total screens: ${matrix.screens.length}`);
  console.log(`Platforms: ${matrix.platforms.join(', ')}`);
  console.log(`Themes: ${matrix.themes.join(', ')}`);
  console.log(`Font scales: ${matrix.fontScales.join(', ')}`);
  console.log(`States: ${matrix.states.join(', ')}`);
  console.log(`Total combinations: ${totalCombinations}`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(matrix, null, 2), 'utf-8');
  console.log(`\nScreen matrix saved to: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  try {
    const matrix = discoverScreens();
    generateScreenMatrix(matrix);
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Screen discovery failed:', err);
    process.exit(1);
  }
}

export { discoverScreens, type ScreenInfo, type ScreenMatrix };
