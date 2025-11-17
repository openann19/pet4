/**
 * Manual Profile Generator
 *
 * Generates 15 diverse pet profiles without AI/LLM
 * Useful when AI is unavailable or for consistent testing data
 */

import { FixerError } from './fixer-error';
import { logger } from './logger';
import { calculateTrustProfile, generateRatings, generateTrustBadges } from './trust-utils';
import type { Pet } from './types';
import { userService } from './user-service';

const MANUAL_PROFILES = [
  {
    name: 'Luna',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'female' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&q=80',
    bio: 'Luna is a bundle of joy who loves making new friends at the dog park. She adores outdoor adventures, water activities, and is always ready for a game of fetch with her favorite tennis ball!',
    personality: ['Playful', 'Social', 'Energetic', 'Friendly', 'Affectionate'],
    interests: ['Fetch', 'Swimming', 'Parks', 'Running', 'Beach'],
    lookingFor: ['Playdate', 'Adventure Buddy', 'Best Friend'],
    location: 'San Francisco, CA',
    ownerName: 'Sarah Johnson',
    verified: true,
  },
  {
    name: 'Max',
    breed: 'French Bulldog',
    age: 2,
    gender: 'male' as const,
    size: 'small' as const,
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    bio: 'Max is a charming little guy with a big personality and an even bigger heart. He loves lounging on the couch and getting belly rubs, but also enjoys short walks and meeting new four-legged pals at his favorite café.',
    personality: ['Gentle', 'Affectionate', 'Social', 'Playful', 'Calm'],
    interests: ['Cuddling', 'Treats', 'Parks', 'Napping', 'Car Rides'],
    lookingFor: ['Playdate', 'Cuddle Companion', 'Best Friend'],
    location: 'Los Angeles, CA',
    ownerName: 'Michael Chen',
    verified: true,
  },
  {
    name: 'Bella',
    breed: 'Border Collie',
    age: 4,
    gender: 'female' as const,
    size: 'medium' as const,
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    bio: 'Bella is incredibly smart and loves learning new tricks and commands. She thrives on mental stimulation and physical activity, making her perfect for agility training or long hikes. Looking for an equally active companion!',
    personality: ['Energetic', 'Curious', 'Loyal', 'Protective', 'Social'],
    interests: ['Hiking', 'Running', 'Fetch', 'Exploring', 'Toys'],
    lookingFor: ['Training Partner', 'Adventure Buddy', 'Best Friend'],
    location: 'Seattle, WA',
    ownerName: 'Emily Rodriguez',
    verified: true,
  },
  {
    name: 'Charlie',
    breed: 'Labrador Retriever',
    age: 5,
    gender: 'male' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&q=80',
    bio: 'Charlie is the definition of a gentle giant with a heart of gold. He loves everyone he meets and is excellent with other dogs and children. Water is his absolute favorite - he could swim all day!',
    personality: ['Gentle', 'Friendly', 'Loyal', 'Calm', 'Affectionate'],
    interests: ['Swimming', 'Fetch', 'Beach', 'Cuddling', 'Treats'],
    lookingFor: ['Playdate', 'Swimming Buddy', 'Best Friend'],
    location: 'Miami, FL',
    ownerName: 'David Martinez',
    verified: true,
  },
  {
    name: 'Milo',
    breed: 'Beagle',
    age: 3,
    gender: 'male' as const,
    size: 'medium' as const,
    photo: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80',
    bio: 'Milo is a curious and friendly explorer who follows his nose wherever it leads. He loves discovering new scents on trails and making friends at every turn. His tail never stops wagging!',
    personality: ['Curious', 'Friendly', 'Playful', 'Social', 'Energetic'],
    interests: ['Exploring', 'Hiking', 'Treats', 'Parks', 'Running'],
    lookingFor: ['Adventure Buddy', 'Playdate', 'Walking Buddy'],
    location: 'Austin, TX',
    ownerName: 'Jessica Williams',
    verified: false,
  },
  {
    name: 'Daisy',
    breed: 'Pembroke Welsh Corgi',
    age: 2,
    gender: 'female' as const,
    size: 'small' as const,
    photo: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&q=80',
    bio: 'Daisy is a spirited little herding dog with short legs and a big smile. She loves to play and has an infectious enthusiasm for life. Her favorite activities include chasing toys and organizing play groups!',
    personality: ['Playful', 'Energetic', 'Social', 'Friendly', 'Loyal'],
    interests: ['Toys', 'Fetch', 'Parks', 'Cuddling', 'Treats'],
    lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
    location: 'Portland, OR',
    ownerName: 'Amanda Lee',
    verified: true,
  },
  {
    name: 'Rocky',
    breed: 'German Shepherd',
    age: 6,
    gender: 'male' as const,
    size: 'extra-large' as const,
    photo: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80',
    bio: 'Rocky is a noble and confident companion who takes his role as protector seriously while being a total softie with his trusted friends. He excels at training and loves having a job to do.',
    personality: ['Protective', 'Loyal', 'Calm', 'Gentle', 'Curious'],
    interests: ['Hiking', 'Running', 'Exploring', 'Toys', 'Car Rides'],
    lookingFor: ['Training Partner', 'Adventure Buddy', 'Walking Buddy'],
    location: 'Denver, CO',
    ownerName: 'James Anderson',
    verified: true,
  },
  {
    name: 'Coco',
    breed: 'Poodle Mix',
    age: 1,
    gender: 'female' as const,
    size: 'small' as const,
    photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80',
    bio: 'Coco is a fluffy ball of energy and sweetness who brings joy wherever she goes. She loves learning new tricks for treats and enjoys cozy cuddles after playtime. Still discovering the world!',
    personality: ['Playful', 'Affectionate', 'Curious', 'Social', 'Energetic'],
    interests: ['Toys', 'Treats', 'Cuddling', 'Parks', 'Exploring'],
    lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
    location: 'Boston, MA',
    ownerName: 'Sophia Taylor',
    verified: false,
  },
  {
    name: 'Zeus',
    breed: 'Siberian Husky',
    age: 4,
    gender: 'male' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&q=80',
    bio: 'Zeus is a majestic and athletic husky who thrives in active environments. He loves running, hiking, and cool weather adventures. His striking blue eyes and friendly demeanor make him impossible to resist!',
    personality: ['Energetic', 'Social', 'Playful', 'Independent', 'Friendly'],
    interests: ['Running', 'Hiking', 'Exploring', 'Parks', 'Toys'],
    lookingFor: ['Adventure Buddy', 'Running Partner', 'Playdate'],
    location: 'Minneapolis, MN',
    ownerName: 'Ryan Murphy',
    verified: true,
  },
  {
    name: 'Rosie',
    breed: 'Cavalier King Charles Spaniel',
    age: 5,
    gender: 'female' as const,
    size: 'small' as const,
    photo: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=800&q=80',
    bio: 'Rosie is the epitome of grace and elegance with a heart full of love. She adores being close to her people and other gentle pets. Perfect for calm walks and cozy afternoons together.',
    personality: ['Gentle', 'Affectionate', 'Calm', 'Friendly', 'Loyal'],
    interests: ['Cuddling', 'Napping', 'Parks', 'Treats', 'Car Rides'],
    lookingFor: ['Cuddle Companion', 'Walking Buddy', 'Best Friend'],
    location: 'Nashville, TN',
    ownerName: 'Olivia Brown',
    verified: true,
  },
  {
    name: 'Whiskers',
    breed: 'Maine Coon',
    age: 3,
    gender: 'male' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80',
    bio: "Whiskers is a gentle giant with a playful spirit. He loves interactive toys and cuddling sessions, but also enjoys exploring the backyard. He's great with other pets and has a calm, friendly demeanor.",
    personality: ['Gentle', 'Playful', 'Social', 'Calm', 'Curious'],
    interests: ['Toys', 'Cuddling', 'Exploring', 'Napping', 'Treats'],
    lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
    location: 'Phoenix, AZ',
    ownerName: 'Alex Thompson',
    verified: true,
  },
  {
    name: 'Luna',
    breed: 'Siamese',
    age: 2,
    gender: 'female' as const,
    size: 'medium' as const,
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    bio: "Luna is a vocal and affectionate Siamese who loves to chat with her humans. She's curious about everything and enjoys puzzle toys. She's very social and gets along well with other pets.",
    personality: ['Social', 'Affectionate', 'Curious', 'Playful', 'Friendly'],
    interests: ['Toys', 'Cuddling', 'Exploring', 'Treats', 'Napping'],
    lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
    location: 'Chicago, IL',
    ownerName: 'Maria Garcia',
    verified: false,
  },
  {
    name: 'Oliver',
    breed: 'Persian',
    age: 4,
    gender: 'male' as const,
    size: 'medium' as const,
    photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80',
    bio: "Oliver is a regal and calm Persian who enjoys quiet moments and gentle pets. He's not too active but loves watching birds and napping in sunny spots. Perfect companion for a relaxed lifestyle.",
    personality: ['Calm', 'Gentle', 'Quiet', 'Affectionate', 'Independent'],
    interests: ['Napping', 'Cuddling', 'Sunbathing', 'Treats', 'Toys'],
    lookingFor: ['Cuddle Companion', 'Best Friend'],
    location: 'Atlanta, GA',
    ownerName: 'Robert Wilson',
    verified: true,
  },
  {
    name: 'Shadow',
    breed: 'Bengal',
    age: 3,
    gender: 'male' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1573865526739-10c1de0fa28b?w=800&q=80',
    bio: "Shadow is an energetic Bengal with a wild side. He loves climbing, playing fetch, and exploring high places. He's very intelligent and needs lots of stimulation. Great for active families!",
    personality: ['Energetic', 'Curious', 'Playful', 'Independent', 'Adventurous'],
    interests: ['Toys', 'Exploring', 'Running', 'Fetch', 'Climbing'],
    lookingFor: ['Playdate', 'Adventure Buddy', 'Training Partner'],
    location: 'San Diego, CA',
    ownerName: 'Jennifer Davis',
    verified: true,
  },
  {
    name: 'Princess',
    breed: 'Ragdoll',
    age: 2,
    gender: 'female' as const,
    size: 'large' as const,
    photo: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80',
    bio: "Princess is a beautiful Ragdoll with a sweet, docile personality. She goes limp when picked up and loves being held. She's very gentle and gets along with everyone - humans, dogs, and other cats!",
    personality: ['Gentle', 'Affectionate', 'Calm', 'Social', 'Friendly'],
    interests: ['Cuddling', 'Napping', 'Toys', 'Treats', 'Sunbathing'],
    lookingFor: ['Cuddle Companion', 'Best Friend', 'Playdate'],
    location: 'New York, NY',
    ownerName: 'Christopher Moore',
    verified: true,
  },
];

export async function generateManualProfiles(count = 15): Promise<Pet[]> {
  const currentUser = await userService.user().catch(() => null);
  const profilesToUse = MANUAL_PROFILES.slice(0, Math.min(count, MANUAL_PROFILES.length));

  return profilesToUse.map((pet, idx) => {
    const petId = `pet-manual-${Date.now()}-${idx}`;
    const badges = generateTrustBadges(petId, pet.verified);
    const ratingCount = Math.floor(Math.random() * 15) + 3;
    const ratings = generateRatings(petId, ratingCount);
    const trustProfile = calculateTrustProfile(ratings, badges);

    return {
      id: petId,
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      size: pet.size,
      photo: pet.photo,
      photos: [pet.photo],
      bio: pet.bio,
      personality: pet.personality,
      interests: pet.interests,
      lookingFor: pet.lookingFor,
      location: pet.location,
      ownerId: currentUser ? String(currentUser.id) : `owner-${String(idx ?? '')}`,
      ownerName: pet.ownerName,
      ownerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${String(pet.ownerName ?? '')}`,
      verified: pet.verified,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      trustProfile,
      ratings,
    };
  });
}

/**
 * Generate and save profiles to KV storage
 */
export async function generateAndSaveManualProfiles(count = 15): Promise<Pet[]> {
  try {
    logger.info('Generating manual profiles', { count });

    // Get current pets
    const { storage } = await import('./storage');
    const currentPets = (await storage.get<Pet[]>('all-pets')) ?? [];

    // Generate new profiles
    const newPets = await generateManualProfiles(count);

    // Avoid duplicates by ID
    const existingIds = new Set(currentPets.map((p) => p.id));
    const uniqueNewPets = newPets.filter((p) => !existingIds.has(p.id));

    // Save to storage
    const allPets = [...currentPets, ...uniqueNewPets];
    await storage.set('all-pets', allPets);

    logger.info('Generated manual profiles', {
      newProfiles: uniqueNewPets.length,
      totalProfiles: allPets.length,
    });

    return uniqueNewPets;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to generate manual profiles', err, {
      action: 'generateAndSaveManualProfiles',
      count,
    });
    throw new FixerError(
      'Failed to generate manual profiles',
      { action: 'generateAndSaveManualProfiles', count },
      'MANUAL_PROFILE_GENERATION_ERROR'
    );
  }
}

// Expose to window
if (typeof window !== 'undefined') {
  interface WindowWithManualProfiles extends Window {
    generateManualProfiles?: (count?: number) => Promise<Pet[]>;
  }
  const win = window as WindowWithManualProfiles;
  win.generateManualProfiles = generateAndSaveManualProfiles;
}
