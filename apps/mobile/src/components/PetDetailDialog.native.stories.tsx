import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Meta, StoryObj } from '@storybook/react-native'
import PetDetailDialog from './PetDetailDialog.native'
import logger from '@/lib/logger';

// Mock expo-haptics for stories
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  impactAsync: jest.fn(),
}))

// Mock react-native-reanimated for stories
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn(),
  withTiming: jest.fn(),
  interpolate: jest.fn(),
  Extrapolation: {
    CLAMP: 'clamp',
  },
}))

// Mock the reduced motion hook
jest.mock('@mobile/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: jest.fn(() => ({ value: false })),
}))

const meta: Meta<typeof PetDetailDialog> = {
  title: 'Mobile/Components/PetDetailDialog',
  component: PetDetailDialog,
  parameters: {
    docs: {
      description: {
        component: 'A comprehensive mobile dialog for displaying detailed pet information with photo carousel, trust ratings, and owner details.',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof PetDetailDialog>

const mockPet = {
  id: '1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male' as const,
  size: 'large',
  location: 'New York, NY',
  bio: 'Friendly and energetic dog who loves to play fetch in the park. Great with kids and other dogs. Looking for an active family to join!',
  photos: [
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
  ],
  photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  verified: true,
  personality: ['Friendly', 'Energetic', 'Loyal', 'Playful', 'Smart'],
  interests: ['Fetch', 'Walking', 'Swimming', 'Agility Training', 'Cuddling'],
  lookingFor: ['Active Family', 'Large Yard', 'Dog Park Access', 'Weekly Playdates'],
  trustProfile: {
    overallRating: 4.8,
    totalReviews: 25,
    responseRate: 95,
    badges: ['Verified Owner', 'Quick Responder', 'Pet Lover', 'Responsible'],
  },
  ownerName: 'Sarah Johnson',
  ownerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
}

const mockMinimalPet = {
  id: '2',
  name: 'Whiskers',
  breed: 'Domestic Shorthair',
  age: 2,
  gender: 'female' as const,
  size: 'small',
  location: 'Los Angeles, CA',
  bio: 'Sweet and affectionate cat who loves laps and treats.',
  photo: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
  ownerName: 'Mike Chen',
  createdAt: '2024-01-10T09:15:00Z',
  updatedAt: '2024-01-18T16:20:00Z',
}

export const Default: Story = {
  args: {
    pet: mockPet,
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

export const MinimalPet: Story = {
  args: {
    pet: mockMinimalPet,
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

export const UnverifiedPet: Story = {
  args: {
    pet: {
      ...mockPet,
      verified: false,
      trustProfile: undefined,
    },
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

export const SinglePhoto: Story = {
  args: {
    pet: {
      ...mockPet,
      photos: undefined,
    },
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

export const HighRatedOwner: Story = {
  args: {
    pet: {
      ...mockPet,
      trustProfile: {
        ...mockPet.trustProfile,
        overallRating: 5.0,
        totalReviews: 150,
        responseRate: 100,
        badges: ['Top Rated', 'Verified Owner', 'Pet Expert', 'Community Favorite'],
      },
    },
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

export const ManyPersonalityTraits: Story = {
  args: {
    pet: {
      ...mockPet,
      personality: [
        'Friendly', 'Energetic', 'Loyal', 'Playful', 'Smart',
        'Curious', 'Affectionate', 'Trainable', 'Adventurous', 'Social'
      ],
      interests: [
        'Fetch', 'Walking', 'Swimming', 'Agility Training', 'Cuddling',
        'Puzzle Toys', 'Car Rides', 'Beach Visits', 'Dog Sports', 'Training'
      ],
      lookingFor: [
        'Active Family', 'Large Yard', 'Dog Park Access', 'Weekly Playdates',
        'Patient Owners', 'Training Enthusiasts', 'Adventure Seekers'
      ],
    },
    visible: true,
    onClose: () => { logger.info('Dialog closed'); },
  },
}

// Custom wrapper to simulate dialog state for stories
const DialogStoryWrapper: React.FC<{
  children: React.ReactNode
  initialVisible?: boolean
}> = ({ children, initialVisible = false }) => {
  const [visible, setVisible] = React.useState(initialVisible)

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ padding: 20, textAlign: 'center' }}>
        Tap the button to open the pet detail dialog
      </Text>

      {React.cloneElement(children as React.ReactElement, {
        visible,
        onClose: () => { setVisible(false); },
      })}

      {!visible && (
        <View style={{
          position: 'absolute',
          bottom: 40,
          left: 20,
          right: 20,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#6366f1',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => { setVisible(true); }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              View Pet Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export const Interactive: Story = {
  decorators: [
    (Story) => (
      <DialogStoryWrapper>
        <Story />
      </DialogStoryWrapper>
    ),
  ],
  args: {
    pet: mockPet,
    visible: false,
    onClose: () => {},
  },
}
