import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { Pet } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PetDetailScreen({
  route,
}: {
  route: { params: { pet: Pet } };
}): React.JSX.Element {
  const { pet } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: pet.photo }} style={styles.mainImage} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>
              {pet.name}, {pet.age}
            </Text>
            <Text style={styles.breed}>{pet.breed}</Text>
          </View>
          {pet.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.location}>📍 {pet.location}</Text>
        {pet.distance && <Text style={styles.distance}>{pet.distance} miles away</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{pet.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{pet.gender}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{pet.size}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{pet.age} years</Text>
          </View>
        </View>

        {pet.personality && pet.personality.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality</Text>
            <View style={styles.tags}>
              {pet.personality.map((trait, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {pet.interests && pet.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tags}>
              {pet.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {pet.lookingFor && pet.lookingFor.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.tags}>
              {pet.lookingFor.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner</Text>
          <View style={styles.ownerInfo}>
            {pet.ownerAvatar && (
              <Image source={{ uri: pet.ownerAvatar }} style={styles.ownerAvatar} />
            )}
            <Text style={styles.ownerName}>{pet.ownerName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.passButton]}>
          <Text style={styles.actionButtonText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton]}>
          <Text style={styles.actionButtonText}>Like</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  breed: {
    fontSize: 18,
    color: '#666',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ownerName: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#ff4458',
  },
  likeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
