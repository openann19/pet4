import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { Match } from '../types';
import { useStorage } from '../hooks/useStorage';
import { useNavigation } from '@react-navigation/native';

export default function MatchesScreen(): React.JSX.Element {
  const [matches] = useStorage<Match[]>('matches', []);
  const navigation = useNavigation();

  const handleVideoCall = (match: Match) => {
    navigation.navigate(
      'Call' as never,
      {
        callId: `call_${match.id}_${Date.now()}`,
        remoteUserId: match.id,
        remoteName: match.matchedPetName,
        remotePhoto: match.matchedPetPhoto,
      } as never
    );
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <View style={styles.matchCard}>
      <TouchableOpacity
        style={styles.matchContent}
        onPress={() => navigation.navigate('Chat' as never, { matchId: item.id } as never)}
      >
        <Image
          source={{ uri: item.matchedPetPhoto || 'https://via.placeholder.com/100' }}
          style={styles.matchImage}
        />
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{item.matchedPetName}</Text>
          <View style={styles.compatibilityBar}>
            <View style={[styles.compatibilityFill, { width: `${item.compatibilityScore}%` }]} />
          </View>
          <Text style={styles.compatibilityText}>{item.compatibilityScore}% Compatible</Text>
          <Text style={styles.matchDate}>
            Matched {new Date(item.matchedAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.callButton} onPress={() => handleVideoCall(item)}>
        <Text style={styles.callButtonText}>📹</Text>
      </TouchableOpacity>
    </View>
  );

  if (matches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💝</Text>
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptyText}>Keep swiping to find your perfect pet match!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </Text>
      </View>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContent: {
    flexDirection: 'row',
  },
  callButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 20,
  },
  matchImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  compatibilityBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  compatibilityFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  compatibilityText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
