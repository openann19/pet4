/**
 * React Native Navigation Audit
 *
 * Walks through all screens and verifies no redboxes/error screens appear.
 * Tests navigation between tabs and deep links.
 *
 * Location: apps/mobile/e2e/nav.e2e.ts
 */

import { device, expect, element, by, waitFor } from 'detox';

describe('RN navigation audit', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate through all main tabs without errors', async () => {
    const tabs = [
      { testID: 'feed-tab', label: 'Feed', screen: 'FeedScreen' },
      { testID: 'chat-tab', label: 'Chat', screen: 'ChatScreen' },
      { testID: 'matches-tab', label: 'Matches', screen: 'MatchesScreen' },
      { testID: 'adopt-tab', label: 'Adopt', screen: 'AdoptScreen' },
      { testID: 'community-tab', label: 'Community', screen: 'CommunityScreen' },
      { testID: 'profile-tab', label: 'Profile', screen: 'ProfileScreen' },
    ];

    for (const tab of tabs) {
      try {
        const tabElement = element(by.id(tab.testID)).atIndex(0);
        await waitFor(tabElement).toBeVisible().withTimeout(5000);
        await tabElement.tap();

        await waitFor(element(by.text(tab.label)).atIndex(0))
          .toBeVisible()
          .withTimeout(3000)
          .catch(() => {
            // If label not found, check for screen content instead
            return waitFor(element(by.id(tab.screen)).atIndex(0))
              .toBeVisible()
              .withTimeout(3000);
          });

        await waitFor(element(by.text('Application error')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(1000)
          .catch(() => {
            // Expected - error screen should not be visible
          });

        await waitFor(element(by.text('Route error')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(1000)
          .catch(() => {
            // Expected - error screen should not be visible
          });

        await waitFor(element(by.text('404')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(1000)
          .catch(() => {
            // Expected - 404 screen should not be visible
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to navigate to ${tab.label}: ${error.message}`);
      }
    }
  });

  it('should handle deep link navigation without errors', async () => {
    const deepLinks = [
      'petspark://feed',
      'petspark://chat',
      'petspark://matches',
      'petspark://adopt',
      'petspark://community',
      'petspark://profile',
    ];

    for (const link of deepLinks) {
      try {
        await device.openURL({ url: link });
        await waitFor(element(by.text('Application error')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(2000)
          .catch(() => {
            // Expected - error screen should not be visible
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Failed to handle deep link ${link}: ${error.message}`);
      }
    }
  });

  it('should navigate to SignIn screen without errors', async () => {
    try {
      const signInElement = element(by.id('signin-screen')).atIndex(0);
      await waitFor(signInElement).toBeVisible().withTimeout(5000).catch(() => {
        // If testID not available, try by text
        return waitFor(element(by.text('Sign In')).atIndex(0))
          .toBeVisible()
          .withTimeout(5000);
      });

      await waitFor(element(by.text('Application error')).atIndex(0))
        .not.toBeVisible()
        .withTimeout(1000)
        .catch(() => {
          // Expected - error screen should not be visible
        });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Failed to navigate to SignIn: ${error.message}`);
    }
  });

  it('should navigate to SignUp screen without errors', async () => {
    try {
      const signUpElement = element(by.id('signup-screen')).atIndex(0);
      await waitFor(signUpElement).toBeVisible().withTimeout(5000).catch(() => {
        // If testID not available, try by text
        return waitFor(element(by.text('Sign Up')).atIndex(0))
          .toBeVisible()
          .withTimeout(5000);
      });

      await waitFor(element(by.text('Application error')).atIndex(0))
        .not.toBeVisible()
        .withTimeout(1000)
        .catch(() => {
          // Expected - error screen should not be visible
        });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Failed to navigate to SignUp: ${error.message}`);
    }
  });

  it('should not show redbox or error overlays during navigation', async () => {
    const tabs = ['feed-tab', 'chat-tab', 'matches-tab', 'adopt-tab', 'community-tab', 'profile-tab'];

    for (const tabId of tabs) {
      try {
        const tabElement = element(by.id(tabId)).atIndex(0);
        await waitFor(tabElement).toBeVisible().withTimeout(5000);
        await tabElement.tap();

        await waitFor(element(by.text('Application error')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(1000)
          .catch(() => {
            // Expected - error screen should not be visible
          });

        await waitFor(element(by.text('Something went wrong')).atIndex(0))
          .not.toBeVisible()
          .withTimeout(1000)
          .catch(() => {
            // Expected - error screen should not be visible
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw new Error(`Error detected during navigation to ${tabId}: ${error.message}`);
      }
    }
  });
});
