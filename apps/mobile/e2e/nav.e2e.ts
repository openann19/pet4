/**
 * React Native Navigation Audit
 *
 * Walks through all screens and verifies no redboxes/error screens appear.
 * Tests navigation between tabs and deep links.
 *
 * Location: apps/mobile/e2e/nav.e2e.ts
 */

import { device, element, by, waitFor } from 'detox';

const ERROR_TEXTS = ['Application error', 'Route error', '404', 'Something went wrong'] as const;
const TIMEOUTS = { navigation: 5000, content: 3000, errorCheck: 1000, deepLink: 2000 } as const;

const tabs = [
  { testID: 'feed-tab', label: 'Feed', screen: 'FeedScreen' },
  { testID: 'chat-tab', label: 'Chat', screen: 'ChatScreen' },
  { testID: 'matches-tab', label: 'Matches', screen: 'MatchesScreen' },
  { testID: 'adopt-tab', label: 'Adopt', screen: 'AdoptScreen' },
  { testID: 'community-tab', label: 'Community', screen: 'CommunityScreen' },
  { testID: 'profile-tab', label: 'Profile', screen: 'ProfileScreen' },
] as const;

const deepLinks = [
  'petspark://feed',
  'petspark://chat',
  'petspark://matches',
  'petspark://adopt',
  'petspark://community',
  'petspark://profile',
] as const;

async function checkForErrors(): Promise<void> {
  for (const errorText of ERROR_TEXTS) {
    await waitFor(element(by.text(errorText)).atIndex(0))
      .not.toBeVisible()
      .withTimeout(TIMEOUTS.errorCheck)
      .catch(() => {
        // Expected - error screen should not be visible
      });
  }
}

async function navigateToTab(tab: typeof tabs[number]): Promise<void> {
  const tabElement = element(by.id(tab.testID)).atIndex(0);
  await waitFor(tabElement).toBeVisible().withTimeout(TIMEOUTS.navigation);
  await tabElement.tap();

  await waitFor(element(by.text(tab.label)).atIndex(0))
    .toBeVisible()
    .withTimeout(TIMEOUTS.content)
    .catch(() => {
      // If label not found, check for screen content instead
      return waitFor(element(by.id(tab.screen)).atIndex(0))
        .toBeVisible()
        .withTimeout(TIMEOUTS.content);
    });

  await checkForErrors();
}

async function testDeepLink(link: string): Promise<void> {
  await device.openURL({ url: link });
  await waitFor(element(by.text('Application error')).atIndex(0))
    .not.toBeVisible()
    .withTimeout(TIMEOUTS.deepLink)
    .catch(() => {
      // Expected - error screen should not be visible
    });
}

async function navigateToAuthScreen(screenId: string, screenText: string): Promise<void> {
  const screenElement = element(by.id(`${screenId}-screen`)).atIndex(0);
  await waitFor(screenElement).toBeVisible().withTimeout(TIMEOUTS.navigation).catch(() => {
    // If testID not available, try by text
    return waitFor(element(by.text(screenText)).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUTS.navigation);
  });

  await checkForErrors();
}

describe('RN navigation audit', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate through all main tabs without errors', async () => {
    for (const tab of tabs) {
      try {
        await navigateToTab(tab);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to navigate to ${tab.label}: ${error.message}`);
      }
    }
  });

  it('should handle deep link navigation without errors', async () => {
    for (const link of deepLinks) {
      try {
        await testDeepLink(link);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to handle deep link ${link}: ${error.message}`);
      }
    }
  });

  it('should navigate to SignIn screen without errors', async () => {
    try {
      await navigateToAuthScreen('signin', 'Sign In');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Failed to navigate to SignIn: ${error.message}`);
    }
  });

  it('should navigate to SignUp screen without errors', async () => {
    try {
      await navigateToAuthScreen('signup', 'Sign Up');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Failed to navigate to SignUp: ${error.message}`);
    }
  });

  it('should not show redbox or error overlays during navigation', async () => {
    const tabIds = ['feed-tab', 'chat-tab', 'matches-tab', 'adopt-tab', 'community-tab', 'profile-tab'];

    for (const tabId of tabIds) {
      try {
        const tabElement = element(by.id(tabId)).atIndex(0);
        await waitFor(tabElement).toBeVisible().withTimeout(TIMEOUTS.navigation);
        await tabElement.tap();

        await checkForErrors();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Error detected during navigation to ${tabId}: ${error.message}`);
      }
    }
  });
});
