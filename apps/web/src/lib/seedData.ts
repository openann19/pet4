import { buildLLMPrompt } from './llm-prompt';
import { llmService } from './llm-service';
import { parseLLMError } from './llm-utils';
import { createLogger } from './logger';
import { calculateTrustProfile, generateRatings, generateTrustBadges } from './trust-utils';
import type { Pet } from './types';
import { userService } from './user-service';

const logger = createLogger('seedData');

interface LLMGeneratedPet {
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  photo: string;
  bio: string;
  personality: string[];
  interests: string[];
  lookingFor: string[];
  location: string;
  ownerName: string;
  verified: boolean;
}

export async function generateSamplePets(count = 15): Promise<Pet[]> {
  // Validate count parameter
  const validCount =
    typeof count === 'number' && count > 0 && count <= 100 ? Math.floor(count) : 15;
  if (typeof count !== 'number' || count <= 0 || count > 100) {
    logger.warn(`Invalid count provided to generateSamplePets: ${count}, using default: 15`);
  }

  const prompt = buildLLMPrompt`Generate exactly ${validCount} diverse and realistic pet profiles for a premium pet matching platform. Create a rich mix of dogs and cats with varied breeds, ages, personalities, and interests that feel authentic and engaging. Return the result as a valid JSON object with a single property called "pets" that contains the pet list.

Requirements for maximum diversity and realism:

BREEDS - Use realistic, varied breeds:
Dogs: Golden Retriever, French Bulldog, Border Collie, Labrador Retriever, Beagle, Pembroke Welsh Corgi, German Shepherd, Poodle Mix, Siberian Husky, Cavalier King Charles Spaniel, Australian Shepherd, Boston Terrier, Boxer, Shih Tzu, Cocker Spaniel, Dachshund, Pomeranian, Rottweiler, Jack Russell Terrier, Maltese
Cats: Maine Coon, Siamese, Persian, Bengal, Ragdoll, British Shorthair, Scottish Fold, Sphynx, Russian Blue, Abyssinian

DEMOGRAPHICS:
- Ages: 1-12 years (balanced across ranges)
- Gender: balanced male/female split
- Sizes: balanced across small, medium, large, extra-large
- Locations: diverse US cities (San Francisco, Los Angeles, Seattle, Miami, Austin, Portland, Denver, Boston, Minneapolis, Nashville, Phoenix, Chicago, Atlanta, San Diego, Philadelphia, New York, Dallas, Houston, Charlotte, Indianapolis)

PERSONALITIES - Rich trait combinations (3-5 from):
Playful, Calm, Energetic, Gentle, Social, Independent, Affectionate, Curious, Protective, Loyal, Friendly, Quiet, Adventurous, Mellow

INTERESTS - Varied activities (3-5 from):
Fetch, Swimming, Hiking, Running, Cuddling, Treats, Toys, Parks, Beach, Car Rides, Napping, Exploring, Training, Agility, Sunbathing (cats), Bird Watching (cats)

LOOKING FOR - Clear intentions (1-3 from):
Playdate, Walking Buddy, Best Friend, Training Partner, Cuddle Companion, Adventure Buddy

BIOS: Write engaging, personality-rich bios (2-3 sentences) that:
- Capture unique character traits
- Mention specific behaviors or quirks
- Feel authentic and warm
- Vary in tone (some energetic, some mellow, some funny)

PHOTOS: Use real Unsplash photo IDs in this exact format:
https://images.unsplash.com/photo-[ID]?w=800&q=80

Real dog photo IDs: 1633722715463-d30f4f325e24, 1583511655857-d19b40a7a54e, 1587300003388-59208cc962cb, 1554224311-beee415c201f, 1505628346881-b72b27e84530, 1546527868-ccb7ee7dfa6a, 1568572933382-74d440642117, 1537151608828-ea2b11777ee8, 1605568427561-40dd23c2acea, 1587402092301-725e37c70fd8, 1568393691622-c7ba131d63b4, 1574158622682-e40e69881006, 1543466835-00a7907e9de1, 1548199973-03cce0bbc87b, 1583337130417-3346a1be7dee, 1534361960057-19889db9621e, 1517849845537-4d257902454a, 1477884213360-7c16890d170b, 1517423440428-a5a00ad493e8, 1588943211346-0908a1e4b3e1

Real cat photo IDs: 1574158622682-e40e69881006, 1514888286974-6c03e2ca1dba, 1518791841217-8f162f1e1131, 1573865526739-10c1de0fa28b, 1529778873920-4da4926a72c2, 1495360010541-bf85ad5ea29b, 1533738363-b7f79e0d76fb, 1526336024174-e58f5cdd8e01, 1513360371669-4adf3dd7dff8, 1478098711619-5ab0b478d6e6

OWNER NAMES: Use diverse, realistic names (mix of cultures/backgrounds)

VERIFIED STATUS: Random true/false (~60% verified)

Return ONLY valid JSON in this exact structure:
{
  "pets": [
    {
      "name": "string",
      "breed": "string",
      "age": number,
      "gender": "male" | "female",
      "size": "small" | "medium" | "large" | "extra-large",
      "photo": "string (full unsplash URL)",
      "bio": "string",
      "personality": ["string", "string", "string"],
      "interests": ["string", "string", "string"],
      "lookingFor": ["string"],
      "location": "string (City, State)",
      "ownerName": "string",
      "verified": boolean
    }
  ]
}`;

  try {
    const result = await llmService.llm(prompt, 'gpt-4o', true);
    const data = JSON.parse(result) as { pets?: LLMGeneratedPet[] };

    const currentUser = await userService.user().catch(() => null);

    if (!data.pets || !Array.isArray(data.pets) || data.pets.length === 0) {
      logger.warn('AI generated invalid or empty pet data, using fallback');
      return getFallbackPets();
    }

    return data.pets.map((pet: LLMGeneratedPet, idx: number) => {
      const petId = `pet-${Date.now()}-${idx}`;
      const badges = generateTrustBadges(petId, Boolean(pet.verified));
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
        personality: Array.isArray(pet.personality) ? pet.personality : [],
        interests: Array.isArray(pet.interests) ? pet.interests : [],
        lookingFor: Array.isArray(pet.lookingFor) ? pet.lookingFor : [],
        location: pet.location,
        ownerId: currentUser?.id ?? `owner-${idx}`,
        ownerName: pet.ownerName,
        ownerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.ownerName}`,
        verified: Boolean(pet.verified),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        trustProfile,
        ratings,
      };
    });
  } catch (error) {
    const errorInfo = parseLLMError(error);
    // Debug only - expected fallback behavior when LLM service is unavailable
    logger.debug(errorInfo.technicalMessage);
    // User-friendly message for expected fallback
    logger.info(errorInfo.userMessage);
    return getFallbackPets();
  }
}

function getFallbackPets(): Pet[] {
  const fallbackPetsData: Omit<Pet, 'trustProfile' | 'ratings'>[] = [
    {
      id: 'sample-pet-1',
      name: 'Luna',
      breed: 'Golden Retriever',
      age: 3,
      gender: 'female' as const,
      size: 'large' as const,
      photo: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&q=80'],
      bio: 'Luna is a bundle of joy who loves making new friends at the dog park. She adores outdoor adventures, water activities, and is always ready for a game of fetch with her favorite tennis ball!',
      personality: ['Playful', 'Social', 'Energetic', 'Friendly', 'Affectionate'],
      interests: ['Fetch', 'Swimming', 'Parks', 'Running', 'Beach'],
      lookingFor: ['Playdate', 'Adventure Buddy', 'Best Friend'],
      location: 'San Francisco, CA',
      ownerId: 'owner-1',
      ownerName: 'Sarah Johnson',
      ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah Johnson',
      verified: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-2',
      name: 'Max',
      breed: 'French Bulldog',
      age: 2,
      gender: 'male' as const,
      size: 'small' as const,
      photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80'],
      bio: 'Max is a charming little guy with a big personality and an even bigger heart. He loves lounging on the couch and getting belly rubs, but also enjoys short walks and meeting new four-legged pals at his favorite café.',
      personality: ['Gentle', 'Affectionate', 'Social', 'Playful', 'Calm'],
      interests: ['Cuddling', 'Treats', 'Parks', 'Napping', 'Car Rides'],
      lookingFor: ['Playdate', 'Cuddle Companion', 'Best Friend'],
      location: 'Los Angeles, CA',
      ownerId: 'owner-2',
      ownerName: 'Michael Chen',
      ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael Chen',
      verified: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-3',
      name: 'Bella',
      breed: 'Border Collie',
      age: 4,
      gender: 'female',
      size: 'medium',
      photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80'],
      bio: 'Bella is incredibly smart and loves learning new tricks and commands. She thrives on mental stimulation and physical activity, making her perfect for agility training or long hikes. Looking for an equally active companion!',
      personality: ['Energetic', 'Curious', 'Loyal', 'Protective', 'Social'],
      interests: ['Hiking', 'Running', 'Fetch', 'Exploring', 'Toys'],
      lookingFor: ['Training Partner', 'Adventure Buddy', 'Best Friend'],
      location: 'Seattle, WA',
      ownerId: 'owner-3',
      ownerName: 'Emily Rodriguez',
      ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily Rodriguez',
      verified: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-4',
      name: 'Charlie',
      breed: 'Labrador Retriever',
      age: 5,
      gender: 'male',
      size: 'large',
      photo: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&q=80'],
      bio: 'Charlie is the definition of a gentle giant with a heart of gold. He loves everyone he meets and is excellent with other dogs and children. Water is his absolute favorite - he could swim all day!',
      personality: ['Gentle', 'Friendly', 'Loyal', 'Calm', 'Affectionate'],
      interests: ['Swimming', 'Fetch', 'Beach', 'Cuddling', 'Treats'],
      lookingFor: ['Playdate', 'Swimming Buddy', 'Best Friend'],
      location: 'Miami, FL',
      ownerId: 'owner-4',
      ownerName: 'David Martinez',
      verified: true,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-5',
      name: 'Milo',
      breed: 'Beagle',
      age: 3,
      gender: 'male',
      size: 'medium',
      photo: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80'],
      bio: 'Milo is a curious and friendly explorer who follows his nose wherever it leads. He loves discovering new scents on trails and making friends at every turn. His tail never stops wagging!',
      personality: ['Curious', 'Friendly', 'Playful', 'Social', 'Energetic'],
      interests: ['Exploring', 'Hiking', 'Treats', 'Parks', 'Running'],
      lookingFor: ['Adventure Buddy', 'Playdate', 'Walking Buddy'],
      location: 'Austin, TX',
      ownerId: 'owner-5',
      ownerName: 'Jessica Williams',
      verified: false,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-6',
      name: 'Daisy',
      breed: 'Pembroke Welsh Corgi',
      age: 2,
      gender: 'female',
      size: 'small',
      photo: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&q=80'],
      bio: 'Daisy is a spirited little herding dog with short legs and a big smile. She loves to play and has an infectious enthusiasm for life. Her favorite activities include chasing toys and organizing play groups!',
      personality: ['Playful', 'Energetic', 'Social', 'Friendly', 'Loyal'],
      interests: ['Toys', 'Fetch', 'Parks', 'Cuddling', 'Treats'],
      lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
      location: 'Portland, OR',
      ownerId: 'owner-6',
      ownerName: 'Amanda Lee',
      verified: true,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-7',
      name: 'Rocky',
      breed: 'German Shepherd',
      age: 6,
      gender: 'male',
      size: 'extra-large',
      photo: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80'],
      bio: 'Rocky is a noble and confident companion who takes his role as protector seriously while being a total softie with his trusted friends. He excels at training and loves having a job to do.',
      personality: ['Protective', 'Loyal', 'Calm', 'Gentle', 'Curious'],
      interests: ['Hiking', 'Running', 'Exploring', 'Toys', 'Car Rides'],
      lookingFor: ['Training Partner', 'Adventure Buddy', 'Walking Buddy'],
      location: 'Denver, CO',
      ownerId: 'owner-7',
      ownerName: 'James Anderson',
      verified: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-8',
      name: 'Coco',
      breed: 'Poodle Mix',
      age: 1,
      gender: 'female',
      size: 'small',
      photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80'],
      bio: 'Coco is a fluffy ball of energy and sweetness who brings joy wherever she goes. She loves learning new tricks for treats and enjoys cozy cuddles after playtime. Still discovering the world!',
      personality: ['Playful', 'Affectionate', 'Curious', 'Social', 'Energetic'],
      interests: ['Toys', 'Treats', 'Cuddling', 'Parks', 'Exploring'],
      lookingFor: ['Playdate', 'Best Friend', 'Cuddle Companion'],
      location: 'Boston, MA',
      ownerId: 'owner-8',
      ownerName: 'Sophia Taylor',
      verified: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-9',
      name: 'Zeus',
      breed: 'Siberian Husky',
      age: 4,
      gender: 'male',
      size: 'large',
      photo: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&q=80'],
      bio: 'Zeus is a majestic and athletic husky who thrives in active environments. He loves running, hiking, and cool weather adventures. His striking blue eyes and friendly demeanor make him impossible to resist!',
      personality: ['Energetic', 'Social', 'Playful', 'Independent', 'Friendly'],
      interests: ['Running', 'Hiking', 'Exploring', 'Parks', 'Toys'],
      lookingFor: ['Adventure Buddy', 'Running Partner', 'Playdate'],
      location: 'Minneapolis, MN',
      ownerId: 'owner-9',
      ownerName: 'Ryan Murphy',
      verified: true,
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-10',
      name: 'Rosie',
      breed: 'Cavalier King Charles Spaniel',
      age: 5,
      gender: 'female',
      size: 'small',
      photo: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=800&q=80'],
      bio: 'Rosie is the epitome of grace and elegance with a heart full of love. She adores being close to her people and other gentle pets. Perfect for calm walks and cozy afternoons together.',
      personality: ['Gentle', 'Affectionate', 'Calm', 'Friendly', 'Loyal'],
      interests: ['Cuddling', 'Napping', 'Parks', 'Treats', 'Car Rides'],
      lookingFor: ['Cuddle Companion', 'Walking Buddy', 'Best Friend'],
      location: 'Nashville, TN',
      ownerId: 'owner-10',
      ownerName: 'Olivia Brown',
      verified: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-11',
      name: 'Buddy',
      breed: 'Australian Shepherd',
      age: 3,
      gender: 'male',
      size: 'medium',
      photo: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&q=80'],
      bio: 'Buddy is an intelligent and agile herding dog who excels at agility courses and loves solving puzzle toys. He forms deep bonds with his family and thrives on activity and mental challenges.',
      personality: ['Energetic', 'Loyal', 'Curious', 'Protective', 'Social'],
      interests: ['Hiking', 'Toys', 'Running', 'Fetch', 'Exploring'],
      lookingFor: ['Training Partner', 'Adventure Buddy', 'Best Friend'],
      location: 'Phoenix, AZ',
      ownerId: 'owner-11',
      ownerName: 'Christopher Davis',
      verified: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-12',
      name: 'Pepper',
      breed: 'Boston Terrier',
      age: 4,
      gender: 'female',
      size: 'small',
      photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80'],
      bio: 'Pepper is a spunky and entertaining little comedian who loves being the center of attention. She has tons of energy packed into her compact frame and enjoys making everyone laugh with her silly antics.',
      personality: ['Playful', 'Energetic', 'Social', 'Friendly', 'Curious'],
      interests: ['Toys', 'Parks', 'Treats', 'Exploring', 'Car Rides'],
      lookingFor: ['Playdate', 'Best Friend', 'Adventure Buddy'],
      location: 'Chicago, IL',
      ownerId: 'owner-12',
      ownerName: 'Lauren Garcia',
      verified: true,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-13',
      name: 'Duke',
      breed: 'Boxer',
      age: 3,
      gender: 'male',
      size: 'large',
      photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80'],
      bio: 'Duke is a powerful yet playful companion with boundless enthusiasm for life. He loves rough-and-tumble play sessions but also knows how to be gentle. His goofy personality will keep you entertained for hours!',
      personality: ['Playful', 'Energetic', 'Loyal', 'Protective', 'Friendly'],
      interests: ['Running', 'Fetch', 'Parks', 'Toys', 'Car Rides'],
      lookingFor: ['Playdate', 'Running Partner', 'Best Friend'],
      location: 'Atlanta, GA',
      ownerId: 'owner-13',
      ownerName: 'Marcus Johnson',
      verified: true,
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-14',
      name: 'Willow',
      breed: 'Shih Tzu',
      age: 6,
      gender: 'female',
      size: 'small',
      photo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80'],
      bio: 'Willow is a regal and affectionate lap dog who believes life is best enjoyed from the comfort of a cozy spot. She loves being pampered, gentle walks, and making new friends at her own leisurely pace.',
      personality: ['Calm', 'Affectionate', 'Gentle', 'Friendly', 'Independent'],
      interests: ['Cuddling', 'Napping', 'Treats', 'Car Rides', 'Parks'],
      lookingFor: ['Cuddle Companion', 'Walking Buddy', 'Best Friend'],
      location: 'San Diego, CA',
      ownerId: 'owner-14',
      ownerName: 'Isabella Martinez',
      verified: false,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-pet-15',
      name: 'Cooper',
      breed: 'Cocker Spaniel',
      age: 4,
      gender: 'male',
      size: 'medium',
      photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
      photos: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80'],
      bio: 'Cooper is a sweet and devoted companion with gorgeous silky ears that bounce when he runs. He loves family time, exploring new parks, and is always up for a good adventure followed by quality cuddle time.',
      personality: ['Affectionate', 'Friendly', 'Playful', 'Loyal', 'Social'],
      interests: ['Parks', 'Fetch', 'Cuddling', 'Exploring', 'Swimming'],
      lookingFor: ['Best Friend', 'Adventure Buddy', 'Playdate'],
      location: 'Philadelphia, PA',
      ownerId: 'owner-15',
      ownerName: 'Daniel Wilson',
      verified: true,
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return fallbackPetsData.map((pet) => {
    const badges = generateTrustBadges(pet.id, pet.verified);
    const ratingCount = Math.floor(Math.random() * 15) + 3;
    const ratings = generateRatings(pet.id, ratingCount);
    const trustProfile = calculateTrustProfile(ratings, badges);

    return {
      ...pet,
      trustProfile,
      ratings,
    };
  });
}
