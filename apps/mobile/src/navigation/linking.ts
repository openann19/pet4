/**
 * Deep linking configuration
 * Location: src/navigation/linking.ts
 */

import type { LinkingOptions } from '@react-navigation/native'
import type { RootTabParamList } from './types'

export const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ['petspark://', 'https://petspark.app', 'https://*.petspark.app'],
  config: {
    screens: {
      Feed: 'feed',
      Matches: 'matches',
      Adopt: 'adoption',
      Community: 'community',
      Profile: {
        path: 'profile/:userId?',
        parse: {
          userId: (userId: string) => userId || 'me',
        },
      },
    },
  },
}

