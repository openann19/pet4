import type { PetProfile, OwnerPreferences } from './pet-model';
import type { MatchingWeights, HardGatesConfig } from './matching-config';
import { getSizeCompatibilityMatrix } from './matching-config';
import { getBreedById } from './breeds';

export interface HardGateResult {
  passed: boolean;
  failureReasons: {
    code: string;
    message: { en: string; bg: string };
  }[];
}

export interface MatchScore {
  totalScore: number;
  factorScores: {
    temperamentFit: number;
    energyLevelFit: number;
    lifeStageProximity: number;
    sizeCompatibility: number;
    speciesBreedCompatibility: number;
    socializationCompatibility: number;
    intentMatch: number;
    distance: number;
    healthVaccinationBonus: number;
  };
  explanation: {
    positive: { en: string; bg: string }[];
    negative: { en: string; bg: string }[];
  };
}

// Helper function to validate neuter policy
function validateNeuterPolicy(
  pet1: PetProfile,
  pet2: PetProfile
): { code: string; message: { en: string; bg: string } } | null {
  const hasBreedingIntent = pet1.intents.includes('breeding') || pet2.intents.includes('breeding');
  if (!hasBreedingIntent) {
    return null;
  }

  if (pet1.neuterStatus === 'neutered' || pet2.neuterStatus === 'neutered') {
    return {
      code: 'NEUTER_BREEDING_CONFLICT',
      message: {
        en: 'Breeding intent requires compatible neuter status',
        bg: 'Намерението за развъждане изисква съвместим статус на кастрация',
      },
    };
  }

  return null;
}

export function evaluateHardGates(
  pet1: PetProfile,
  pet2: PetProfile,
  prefs1: OwnerPreferences,
  gates: HardGatesConfig
): HardGateResult {
  const failures: { code: string; message: { en: string; bg: string } }[] = [];

  if (!gates.allowCrossSpecies && pet1.species !== pet2.species) {
    failures.push({
      code: 'SPECIES_MISMATCH',
      message: {
        en: 'Cross-species matching is not currently enabled',
        bg: 'Съвпадението между различни видове не е активирано',
      },
    });
  }

  if (gates.requireVaccinations) {
    if (!pet1.health.vaccinationsUpToDate || !pet2.health.vaccinationsUpToDate) {
      failures.push({
        code: 'VACCINATION_REQUIRED',
        message: {
          en: 'Both pets must have up-to-date vaccinations',
          bg: 'И двете домашни любимци трябва да имат актуални ваксинации',
        },
      });
    }
  }

  if (gates.blockAggressionConflicts) {
    if (pet1.health.aggressionFlags && pet2.socialization.comfortWithStrangers >= 3) {
      failures.push({
        code: 'AGGRESSION_CONFLICT',
        message: {
          en: 'Safety concerns prevent this match',
          bg: 'Проблеми със сигурността предотвратяват това съвпадение',
        },
      });
    }
    if (pet1.health.biteHistory || pet1.health.attackHistory) {
      failures.push({
        code: 'SAFETY_HISTORY',
        message: {
          en: 'Safety history prevents this match',
          bg: 'Историята на сигурността предотвратява това съвпадение',
        },
      });
    }
  }

  if (gates.requireApprovedMedia) {
    const pet1HasApproved = pet1.media.some((m) => m.status === 'approved');
    const pet2HasApproved = pet2.media.some((m) => m.status === 'approved');
    if (!pet1HasApproved || !pet2HasApproved) {
      failures.push({
        code: 'MEDIA_NOT_APPROVED',
        message: {
          en: 'Both pets must have at least one approved photo',
          bg: 'И двете домашни любимци трябва да имат поне една одобрена снимка',
        },
      });
    }
  }

  const distance = calculateDistance(
    pet1.location.roundedLat,
    pet1.location.roundedLng,
    pet2.location.roundedLat,
    pet2.location.roundedLng
  );

  if (!prefs1.globalSearch && distance > prefs1.maxDistanceKm) {
    failures.push({
      code: 'DISTANCE_EXCEEDED',
      message: {
        en: `Distance exceeds maximum preference (${prefs1.maxDistanceKm}km)`,
        bg: `Разстоянието надвишава максималната преференция (${prefs1.maxDistanceKm}км)`,
      },
    });
  }

  if (gates.enforceNeuterPolicy) {
    const neuterPolicyFailure = validateNeuterPolicy(pet1, pet2);
    if (neuterPolicyFailure) {
      failures.push(neuterPolicyFailure);
    }
  }

  if (pet1.blocklist.includes(pet2.id) || pet2.blocklist.includes(pet1.id)) {
    failures.push({
      code: 'BLOCKED',
      message: {
        en: 'One pet has blocked the other',
        bg: 'Един домашен любимец е блокирал другия',
      },
    });
  }

  return {
    passed: failures.length === 0,
    failureReasons: failures,
  };
}

export function calculateMatchScore(
  pet1: PetProfile,
  pet2: PetProfile,
  weights: MatchingWeights
): MatchScore {
  const positive: { en: string; bg: string }[] = [];
  const negative: { en: string; bg: string }[] = [];

  const temperamentScore = scoreTemperamentFit(pet1, pet2, positive, negative);
  const energyScore = scoreEnergyLevelFit(pet1, pet2, positive, negative);
  const lifeStageScore = scoreLifeStageProximity(pet1, pet2, positive, negative);
  const sizeScore = scoreSizeCompatibility(pet1, pet2, positive, negative);
  const breedScore = scoreBreedCompatibility(pet1, pet2, positive, negative);
  const socializationScore = scoreSocializationCompatibility(pet1, pet2, positive, negative);
  const intentScore = scoreIntentMatch(pet1, pet2, positive, negative);
  const distanceScore = scoreDistance(pet1, pet2, positive, negative);
  const healthScore = scoreHealthBonus(pet1, pet2, positive, negative);

  const totalScore = Math.min(
    100,
    (temperamentScore * weights.temperamentFit +
      energyScore * weights.energyLevelFit +
      lifeStageScore * weights.lifeStageProximity +
      sizeScore * weights.sizeCompatibility +
      breedScore * weights.speciesBreedCompatibility +
      socializationScore * weights.socializationCompatibility +
      intentScore * weights.intentMatch +
      distanceScore * weights.distance +
      healthScore * weights.healthVaccinationBonus) /
      100
  );

  return {
    totalScore: Math.round(totalScore),
    factorScores: {
      temperamentFit: Math.round(temperamentScore),
      energyLevelFit: Math.round(energyScore),
      lifeStageProximity: Math.round(lifeStageScore),
      sizeCompatibility: Math.round(sizeScore),
      speciesBreedCompatibility: Math.round(breedScore),
      socializationCompatibility: Math.round(socializationScore),
      intentMatch: Math.round(intentScore),
      distance: Math.round(distanceScore),
      healthVaccinationBonus: Math.round(healthScore),
    },
    explanation: { positive, negative },
  };
}

function scoreTemperamentFit(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  const traits1 = pet1.temperament.traits;
  const traits2 = pet2.temperament.traits;

  const commonTraits = traits1.filter((t) => traits2.includes(t));
  const commonCount = commonTraits.length;
  const totalUnique = new Set([...traits1, ...traits2]).size;

  const score = totalUnique > 0 ? (commonCount / totalUnique) * 100 : 50;

  if (commonCount >= 3) {
    positive.push({
      en: `Share ${commonCount} personality traits`,
      bg: `Споделят ${commonCount} черти на характера`,
    });
  } else if (commonCount === 0) {
    negative.push({
      en: 'Very different personalities',
      bg: 'Много различни личности',
    });
  }

  return score;
}

function scoreEnergyLevelFit(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  const diff = Math.abs(pet1.temperament.energyLevel - pet2.temperament.energyLevel);
  const score = Math.max(0, 100 - diff * 25);

  if (diff === 0) {
    positive.push({
      en: 'Perfectly matched energy levels',
      bg: 'Перфектно съвпадащи енергийни нива',
    });
  } else if (diff >= 3) {
    negative.push({
      en: 'Very different energy levels',
      bg: 'Много различни енергийни нива',
    });
  }

  return score;
}

function scoreLifeStageProximity(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  const ageDiff = Math.abs(pet1.ageMonths - pet2.ageMonths);
  const score = Math.max(0, 100 - (ageDiff / 12) * 10);

  if (ageDiff <= 12) {
    positive.push({
      en: 'Similar age range',
      bg: 'Подобна възрастова група',
    });
  } else if (ageDiff >= 48) {
    negative.push({
      en: 'Significant age difference',
      bg: 'Значителна възрастова разлика',
    });
  }

  return score;
}

function scoreSizeCompatibility(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  if (pet1.species !== pet2.species) return 50;

  const matrix = getSizeCompatibilityMatrix(pet1.species);
  const compatible = matrix[pet1.size]?.includes(pet2.size) ?? false;

  if (compatible) {
    positive.push({
      en: 'Compatible sizes for safe play',
      bg: 'Съвместими размери за безопасна игра',
    });
    return 100;
  } else {
    negative.push({
      en: 'Size mismatch may affect play safety',
      bg: 'Несъответствието в размера може да повлияе на безопасността на играта',
    });
    return 30;
  }
}

function scoreBreedCompatibility(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  _negative: { en: string; bg: string }[]
): number {
  if (pet1.species !== pet2.species) return 50;

  const breed1 = getBreedById(pet1.breedId);
  const breed2 = getBreedById(pet2.breedId);

  if (!breed1 || !breed2) return 50;

  if (breed1.family && breed2.family && breed1.family === breed2.family) {
    positive.push({
      en: `Both are ${breed1.family} breeds`,
      bg: `И двете са ${breed1.family} породи`,
    });
    return 90;
  }

  return 70;
}

function scoreSocializationCompatibility(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  let score = 0;

  if (pet1.species === 'dog' && pet2.species === 'dog') {
    const dogComfort = Math.min(
      pet1.socialization.comfortWithDogs,
      pet2.socialization.comfortWithDogs
    );
    score = (dogComfort / 5) * 100;
    if (dogComfort >= 4) {
      positive.push({
        en: 'Both highly comfortable with other dogs',
        bg: 'И двете са много комфортни с други кучета',
      });
    } else if (dogComfort <= 2) {
      negative.push({
        en: 'Low comfort with other dogs',
        bg: 'Ниска комфортност с други кучета',
      });
    }
  } else if (pet1.species === 'cat' && pet2.species === 'cat') {
    const catComfort = Math.min(
      pet1.socialization.comfortWithCats,
      pet2.socialization.comfortWithCats
    );
    score = (catComfort / 5) * 100;
    if (catComfort >= 4) {
      positive.push({
        en: 'Both highly comfortable with other cats',
        bg: 'И двете са много комфортни с други котки',
      });
    }
  } else {
    const dogComfort =
      pet1.species === 'dog'
        ? pet1.socialization.comfortWithCats
        : pet2.socialization.comfortWithCats;
    const catComfort =
      pet1.species === 'cat'
        ? pet1.socialization.comfortWithDogs
        : pet2.socialization.comfortWithDogs;
    score = (Math.min(dogComfort, catComfort) / 5) * 100;
  }

  return score;
}

function scoreIntentMatch(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  const commonIntents = pet1.intents.filter((i) => pet2.intents.includes(i));

  if (commonIntents.length === 0) {
    negative.push({
      en: 'No matching intents',
      bg: 'Няма съвпадащи намерения',
    });
    return 0;
  }

  positive.push({
    en: `Both interested in ${commonIntents.join(', ')}`,
    bg: `И двете се интересуват от ${commonIntents.join(', ')}`,
  });

  return (commonIntents.length / Math.max(pet1.intents.length, pet2.intents.length)) * 100;
}

function scoreDistance(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  negative: { en: string; bg: string }[]
): number {
  const distanceKm = calculateDistance(
    pet1.location.roundedLat,
    pet1.location.roundedLng,
    pet2.location.roundedLat,
    pet2.location.roundedLng
  );

  const score = Math.max(0, 100 - distanceKm * 2);

  if (distanceKm <= 5) {
    positive.push({
      en: `Very close (${distanceKm.toFixed(1)}km)`,
      bg: `Много близо (${distanceKm.toFixed(1)}км)`,
    });
  } else if (distanceKm >= 30) {
    negative.push({
      en: `Far apart (${distanceKm.toFixed(1)}km)`,
      bg: `Много далеч (${distanceKm.toFixed(1)}км)`,
    });
  }

  return score;
}

function scoreHealthBonus(
  pet1: PetProfile,
  pet2: PetProfile,
  positive: { en: string; bg: string }[],
  _negative: { en: string; bg: string }[]
): number {
  let bonus = 0;

  if (pet1.health.vaccinationsUpToDate && pet2.health.vaccinationsUpToDate) {
    bonus += 50;
  }

  if (pet1.vetVerified && pet2.vetVerified) {
    bonus += 50;
    positive.push({
      en: 'Both vet-verified',
      bg: 'И двете са потвърдени от ветеринар',
    });
  }

  return bonus;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
