import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LiveStreamInterface } from '../components/livestream';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  LiveStream: {
    streamId: string;
    hostName: string;
    isHost: boolean;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'LiveStream'>;

export const LiveStreamScreen: React.FC<Props> = ({ route, navigation }) => {
  const { streamId, hostName, isHost } = route.params;

  const handleEndStream = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LiveStreamInterface
        streamId={streamId}
        hostName={hostName}
        isHost={isHost}
        onEndStream={handleEndStream}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
