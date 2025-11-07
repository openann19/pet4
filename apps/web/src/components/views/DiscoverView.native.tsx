'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native'
import { MotionView } from '@petspark/motion'
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { createLogger } from '@/lib/logger'
import { Heart, X, MapPin, Sparkle } from '@phosphor-icons/react'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('DiscoverView')

export default function DiscoverView() {
  const [isLoading, setIsLoading] = useState(true)
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 })
    setIsLoading(false)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handleLike = useCallback(() => {
    Alert.alert('Like', 'Pet liked!')
  }, [])

  const handlePass = useCallback(() => {
    Alert.alert('Pass', 'Pet passed!')
  }, [])

  if (isTruthy(isLoading)) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <MotionView animatedStyle={animatedStyle} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find your perfect match</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Text style={styles.placeholderImage}>🐾</Text>
            <View style={styles.overlay}>
              <Text style={styles.petName}>Buddy</Text>
              <Text style={styles.petInfo}>Golden Retriever • 2 years • Male</Text>
              <View style={styles.location}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText}>San Francisco, CA</Text>
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.matchScore}>
              <Sparkle size={20} color="#f59e0b" />
              <Text style={styles.matchText}>95% Match</Text>
            </View>

            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>Friendly and energetic dog looking for a loving home!</Text>

            <Text style={styles.personalityTitle}>Personality</Text>
            <View style={styles.tags}>
              <Text style={styles.tag}>Playful</Text>
              <Text style={styles.tag}>Loyal</Text>
              <Text style={styles.tag}>Active</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.passButton} onPress={handlePass}>
              <X size={28} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Heart size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </MotionView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#e5e7eb',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderImage: {
    fontSize: 80,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  petInfo: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#e5e7eb',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  personalityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  passButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#fef2f2',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  likeButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#ec4899',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
