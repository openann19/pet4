import { BottomNavBar, type TabKey } from '@mobile/components/BottomNavBar'
import { AdoptScreen } from '@mobile/screens/AdoptScreen'
import { ChatScreen } from '@mobile/screens/ChatScreen'
import { CommunityScreen } from '@mobile/screens/CommunityScreen'
import { HomeScreen } from '@mobile/screens/HomeScreen'
import { MatchesScreen } from '@mobile/screens/MatchesScreen'
import { ProfileScreen } from '@mobile/screens/ProfileScreen'
import { colors } from '@mobile/theme/colors'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function RootShell(): React.ReactElement {
  const [active, setActive] = useState<TabKey>('feed')

  const Screen = useMemo(() => {
    switch (active) {
      case 'feed':
        return HomeScreen
      case 'community':
        return CommunityScreen
      case 'chat':
        return ChatScreen
      case 'adopt':
        return AdoptScreen
      case 'matches':
        return MatchesScreen
      case 'profile':
        return ProfileScreen
      default:
        return HomeScreen
    }
  }, [active])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Screen />
        </View>
        <BottomNavBar
          active={active}
          onChange={setActive}
          items={[
            { key: 'community', label: 'Community' },
            { key: 'chat', label: 'Chat' },
            { key: 'feed', label: 'Discover' },
            { key: 'adopt', label: 'Adopt' },
            { key: 'matches', label: 'Matches' },
            { key: 'profile', label: 'Profile' },
          ]}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { flex: 1, backgroundColor: colors.background },
})
