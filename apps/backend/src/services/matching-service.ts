import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompatibilityScore {
  personality: number;
  interests: number;
  size: number;
  age: number;
  location: number;
  overall: number;
}

export interface MatchCandidate {
  petId: string;
  score: number;
  compatibility: CompatibilityScore;
}

/**
 * Calculate compatibility score between two pets
 */
export async function calculateCompatibilityScore(
  pet1Id: string,
  pet2Id: string,
): Promise<CompatibilityScore> {
  const [pet1, pet2] = await Promise.all([
    prisma.pet.findUnique({
      where: { id: pet1Id },
      include: {
        photos: { where: { status: 'approved' } },
        owner: {
          include: {
            profile: true,
          },
        },
      },
    }),
    prisma.pet.findUnique({
      where: { id: pet2Id },
      include: {
        photos: { where: { status: 'approved' } },
        owner: {
          include: {
            profile: true,
          },
        },
      },
    }),
  ]);

  if (!pet1 || !pet2) {
    throw new Error('One or both pets not found');
  }

  // Personality compatibility (placeholder - would use ML model in production)
  const personalityScore = 0.7; // Would analyze pet descriptions, behavior patterns

  // Interests compatibility (placeholder)
  const interestsScore = 0.8;

  // Size compatibility
  let sizeScore = 0.5;
  if (pet1.size && pet2.size) {
    const sizeOrder = ['small', 'medium', 'large'];
    const size1Index = sizeOrder.indexOf(pet1.size);
    const size2Index = sizeOrder.indexOf(pet2.size);
    const sizeDiff = Math.abs(size1Index - size2Index);
    sizeScore = sizeDiff === 0 ? 1.0 : sizeDiff === 1 ? 0.7 : 0.3;
  }

  // Age compatibility
  let ageScore = 0.5;
  if (pet1.age && pet2.age) {
    const ageDiff = Math.abs(pet1.age - pet2.age);
    if (ageDiff === 0) ageScore = 1.0;
    else if (ageDiff <= 2) ageScore = 0.8;
    else if (ageDiff <= 5) ageScore = 0.6;
    else ageScore = 0.4;
  }

  // Location compatibility
  let locationScore = 0.5;
  if (pet1.owner.profile?.location && pet2.owner.profile?.location) {
    const loc1 = pet1.owner.profile.location as { lat?: number; lng?: number } | null;
    const loc2 = pet2.owner.profile.location as { lat?: number; lng?: number } | null;
    
    if (loc1 && loc2 && typeof loc1.lat === 'number' && typeof loc1.lng === 'number' &&
        typeof loc2.lat === 'number' && typeof loc2.lng === 'number') {
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
      const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((loc1.lat * Math.PI) / 180) *
          Math.cos((loc2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Score based on distance (closer = higher score)
      if (distance < 5) locationScore = 1.0;
      else if (distance < 10) locationScore = 0.8;
      else if (distance < 25) locationScore = 0.6;
      else if (distance < 50) locationScore = 0.4;
      else locationScore = 0.2;
    }
  }

  // Overall weighted score
  const overall = (
    personalityScore * 0.25 +
    interestsScore * 0.20 +
    sizeScore * 0.15 +
    ageScore * 0.15 +
    locationScore * 0.25
  );

  return {
    personality: Math.round(personalityScore * 100) / 100,
    interests: Math.round(interestsScore * 100) / 100,
    size: Math.round(sizeScore * 100) / 100,
    age: Math.round(ageScore * 100) / 100,
    location: Math.round(locationScore * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}

/**
 * Discover potential matches for a pet
 */
export async function discoverMatches(
  petId: string,
  filters?: {
    species?: string[];
    minAge?: number;
    maxAge?: number;
    maxDistance?: number;
  },
  limit: number = 20,
): Promise<MatchCandidate[]> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      owner: {
        include: {
          profile: true,
        },
      },
      matches: true,
      blockedPets: true,
    },
  });

  if (!pet) {
    throw new Error('Pet not found');
  }

  // Get blocked pet IDs
  const blockedPetIds = pet.blockedPets.map((b) => b.blockedPetId);

  // Get already matched pet IDs
  const matchedPetIds = pet.matches.map((m) => 
    m.pet1Id === petId ? m.pet2Id : m.pet1Id
  );

  // Build where clause
  const where: {
    id?: { notIn: string[] };
    species?: string | { in: string[] };
    age?: { gte?: number; lte?: number };
    ownerId?: { not: string };
  } = {
    id: {
      notIn: [petId, ...blockedPetIds, ...matchedPetIds],
    },
    ownerId: { not: pet.ownerId },
  };

  if (filters?.species && filters.species.length > 0) {
    where.species = { in: filters.species };
  }

  if (filters?.minAge !== undefined || filters?.maxAge !== undefined) {
    where.age = {};
    if (filters.minAge !== undefined) {
      where.age.gte = filters.minAge;
    }
    if (filters.maxAge !== undefined) {
      where.age.lte = filters.maxAge;
    }
  }

  // Get candidate pets
  const candidates = await prisma.pet.findMany({
    where,
    include: {
      photos: { where: { status: 'approved' } },
      owner: {
        include: {
          profile: true,
        },
      },
    },
    take: limit * 2, // Get more to filter by distance if needed
  });

  // Calculate compatibility scores
  const scoredCandidates: MatchCandidate[] = [];

  for (const candidate of candidates) {
    // Filter by distance if specified
    if (filters?.maxDistance && pet.owner.profile?.location && candidate.owner.profile?.location) {
      const loc1 = pet.owner.profile.location as { lat?: number; lng?: number } | null;
      const loc2 = candidate.owner.profile.location as { lat?: number; lng?: number } | null;
      
      if (loc1 && loc2 && typeof loc1.lat === 'number' && typeof loc1.lng === 'number' &&
          typeof loc2.lat === 'number' && typeof loc2.lng === 'number') {
        const R = 6371;
        const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
        const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((loc1.lat * Math.PI) / 180) *
            Math.cos((loc2.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > filters.maxDistance) {
          continue;
        }
      }
    }

    const compatibility = await calculateCompatibilityScore(petId, candidate.id);
    scoredCandidates.push({
      petId: candidate.id,
      score: compatibility.overall,
      compatibility,
    });
  }

  // Sort by score and return top candidates
  return scoredCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

