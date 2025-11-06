import type { AdoptionProfile } from './adoption-types'
import { buildLLMPrompt } from './llm-prompt'
import { llmService } from './llm-service'
import { parseLLMError } from './llm-utils'
import { logger } from './logger'
import { storage } from './storage'

export async function generateAdoptionProfiles(count: number = 12): Promise<AdoptionProfile[]> {
  const prompt = buildLLMPrompt`Generate exactly ${count} diverse pet adoption profiles. 
  
  Return ONLY a valid JSON array of objects, no additional text or explanation.
  
  Each object must have this exact structure:
  {
    "petName": "string (creative pet name)",
    "breed": "string (specific breed)",
    "age": number (1-15),
    "gender": "male" or "female",
    "size": "small" or "medium" or "large" or "extra-large",
    "location": "string (City, State format)",
    "shelterName": "string (realistic shelter name)",
    "description": "string (compelling 2-3 sentence description)",
    "healthStatus": "string (brief health description)",
    "vaccinated": boolean,
    "spayedNeutered": boolean,
    "goodWithKids": boolean,
    "goodWithPets": boolean,
    "energyLevel": "low" or "medium" or "high",
    "specialNeeds": "string or null",
    "adoptionFee": number (50-500),
    "personality": ["string", "string", "string"] (3-5 traits),
    "contactEmail": "string (realistic shelter email)",
    "contactPhone": "string (format: XXX-XXX-XXXX)"
  }

  Make profiles diverse in breeds, ages, sizes, and personalities. Include both dogs and cats.
  Some should be senior pets, puppies/kittens, special needs, etc.`

  interface LLMProfileData {
    petName: string
    breed: string
    age: number
    gender: 'male' | 'female'
    size: 'small' | 'medium' | 'large' | 'extra-large'
    location: string
    shelterName: string
    description: string
    healthStatus: string
    vaccinated: boolean
    spayedNeutered: boolean
    goodWithKids: boolean
    goodWithPets: boolean
    energyLevel: 'low' | 'medium' | 'high'
    specialNeeds?: string | null
    adoptionFee: number
    personality: string[]
    contactEmail: string
    contactPhone: string
  }

  try {
  const response = await llmService.llm(prompt, 'gpt-4o', true)
    const profilesData = JSON.parse(response) as LLMProfileData[]
    
    const profiles: AdoptionProfile[] = profilesData.map((data: LLMProfileData, index: number) => ({
      _id: `adopt-${Date.now()}-${index}`,
      petId: `pet-adopt-${Date.now()}-${index}`,
      petName: data.petName,
      petPhoto: `https://picsum.photos/seed/adopt-${Date.now()}-${index}/800/600`,
      breed: data.breed,
      age: data.age,
      gender: data.gender,
      size: data.size,
      location: data.location,
      shelterId: `shelter-${Math.floor(Math.random() * 10)}`,
      shelterName: data.shelterName,
      status: 'available' as const,
      description: data.description,
      healthStatus: data.healthStatus,
      vaccinated: data.vaccinated,
      spayedNeutered: data.spayedNeutered,
      goodWithKids: data.goodWithKids,
      goodWithPets: data.goodWithPets,
      energyLevel: data.energyLevel,
      ...(data.specialNeeds !== undefined && data.specialNeeds !== null && { specialNeeds: data.specialNeeds }),
      adoptionFee: data.adoptionFee,
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      personality: data.personality,
      photos: [
        `https://picsum.photos/seed/adopt-${Date.now()}-${index}/800/600`,
        `https://picsum.photos/seed/adopt-${Date.now()}-${index}-2/800/600`,
        `https://picsum.photos/seed/adopt-${Date.now()}-${index}-3/800/600`
      ],
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone
    }))

    return profiles
  } catch (error) {
    const errorInfo = parseLLMError(error)
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to generate adoption profiles', err, { 
      technicalMessage: errorInfo.technicalMessage,
      userMessage: errorInfo.userMessage,
      action: 'generateAdoptionProfiles',
      count 
    })
    logger.info('Using fallback profiles', { action: 'generateAdoptionProfiles' })
    return getFallbackProfiles()
  }
}

function getFallbackProfiles(): AdoptionProfile[] {
  const timestamp = Date.now()
  
  return [
    {
      _id: `adopt-${timestamp}-1`,
      petId: `pet-adopt-${timestamp}-1`,
      petName: 'Max',
      petPhoto: `https://picsum.photos/seed/max-dog/800/600`,
      breed: 'Golden Retriever',
      age: 3,
      gender: 'male',
      size: 'large',
      location: 'San Francisco, CA',
      shelterId: 'shelter-1',
      shelterName: 'Happy Paws Rescue',
      status: 'available',
      description: 'Max is a friendly and energetic Golden Retriever who loves playing fetch and going on long walks. He\'s great with families and other dogs.',
      healthStatus: 'Excellent health, up to date on all shots',
      vaccinated: true,
      spayedNeutered: true,
      goodWithKids: true,
      goodWithPets: true,
      energyLevel: 'high',
      adoptionFee: 250,
      postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      personality: ['Friendly', 'Energetic', 'Loyal', 'Playful'],
      photos: [
        `https://picsum.photos/seed/max-dog/800/600`,
        `https://picsum.photos/seed/max-dog-2/800/600`,
        `https://picsum.photos/seed/max-dog-3/800/600`
      ],
      contactEmail: 'info@happypawsrescue.org',
      contactPhone: '415-555-0123'
    },
    {
      _id: `adopt-${timestamp}-2`,
      petId: `pet-adopt-${timestamp}-2`,
      petName: 'Luna',
      petPhoto: `https://picsum.photos/seed/luna-cat/800/600`,
      breed: 'Domestic Shorthair',
      age: 2,
      gender: 'female',
      size: 'small',
      location: 'Portland, OR',
      shelterId: 'shelter-2',
      shelterName: 'Feline Friends Foundation',
      status: 'available',
      description: 'Luna is a sweet and affectionate cat who loves cuddles and sunny windowsills. She\'s perfect for a quiet home.',
      healthStatus: 'Healthy, all vaccinations current',
      vaccinated: true,
      spayedNeutered: true,
      goodWithKids: true,
      goodWithPets: false,
      energyLevel: 'low',
      adoptionFee: 100,
      postedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      personality: ['Affectionate', 'Calm', 'Independent', 'Quiet'],
      photos: [
        `https://picsum.photos/seed/luna-cat/800/600`,
        `https://picsum.photos/seed/luna-cat-2/800/600`
      ],
      contactEmail: 'adopt@felinefriends.org',
      contactPhone: '503-555-0456'
    },
    {
      _id: `adopt-${timestamp}-3`,
      petId: `pet-adopt-${timestamp}-3`,
      petName: 'Buddy',
      petPhoto: `https://picsum.photos/seed/buddy-dog/800/600`,
      breed: 'Beagle Mix',
      age: 5,
      gender: 'male',
      size: 'medium',
      location: 'Seattle, WA',
      shelterId: 'shelter-3',
      shelterName: 'Second Chance Pet Rescue',
      status: 'available',
      description: 'Buddy is a gentle senior dog looking for a calm retirement home. He loves short walks and lots of belly rubs.',
      healthStatus: 'Minor arthritis, manageable with medication',
      vaccinated: true,
      spayedNeutered: true,
      goodWithKids: true,
      goodWithPets: true,
      energyLevel: 'low',
      specialNeeds: 'Requires daily arthritis medication',
      adoptionFee: 50,
      postedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      personality: ['Gentle', 'Patient', 'Loving', 'Calm'],
      photos: [
        `https://picsum.photos/seed/buddy-dog/800/600`,
        `https://picsum.photos/seed/buddy-dog-2/800/600`,
        `https://picsum.photos/seed/buddy-dog-3/800/600`
      ],
      contactEmail: 'hello@secondchancepets.org',
      contactPhone: '206-555-0789'
    }
  ]
}

export async function initializeAdoptionProfiles(): Promise<void> {
  try {
    const existing = await storage.get<AdoptionProfile[]>('adoption-profiles')

    if (!existing || existing.length === 0) {
      logger.info('Generating adoption profiles', { action: 'initializeAdoptionProfiles' })
      const profiles = await generateAdoptionProfiles(12)
      await storage.set('adoption-profiles', profiles)
      logger.info('Generated adoption profiles', {
        profilesCount: profiles.length,
        action: 'initializeAdoptionProfiles',
      })
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to initialize adoption profiles', err, { action: 'initializeAdoptionProfiles' })
  }
}
