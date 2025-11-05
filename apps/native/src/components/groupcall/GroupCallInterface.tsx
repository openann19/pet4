import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const GroupCallInterface: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Group Call Interface</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
  },
});
