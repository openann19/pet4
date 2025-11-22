import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CallInterface } from '../components/call/CallInterface';
import { useNavigation } from '@react-navigation/native';

interface CallScreenProps {
  route: {
    params: {
      callId: string;
      remoteUserId: string;
      remoteName: string;
      remotePhoto?: string;
    };
  };
}

export const CallScreen: React.FC<CallScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { callId, remoteUserId, remoteName, remotePhoto } = route.params;

  const handleEndCall = () => {
    // Navigate back to previous screen
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <CallInterface
        callId={callId}
        remoteUserId={remoteUserId}
        remoteName={remoteName}
        remotePhoto={remotePhoto}
        onEndCall={handleEndCall}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
