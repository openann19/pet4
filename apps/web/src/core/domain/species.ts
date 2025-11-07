export const SPECIES = ['dog', 'cat'] as const
export type Species = typeof SPECIES[number]

export const LIFE_STAGES = {
  dog: {
    puppy: { maxMonths: 12, label: { en: 'Puppy', bg: 'Кученце' } },
    young: { maxMonths: 36, label: { en: 'Young', bg: 'Младо' } },
    adult: { maxMonths: 84, label: { en: 'Adult', bg: 'Възрастно' } },
    senior: { maxMonths: Infinity, label: { en: 'Senior', bg: 'Възрастно' } }
  },
  cat: {
    kitten: { maxMonths: 12, label: { en: 'Kitten', bg: 'Котенце' } },
    young: { maxMonths: 24, label: { en: 'Young', bg: 'Младо' } },
    adult: { maxMonths: 96, label: { en: 'Adult', bg: 'Възрастно' } },
    senior: { maxMonths: Infinity, label: { en: 'Senior', bg: 'Възрастно' } }
  }
} as const

export type DogLifeStage = keyof typeof LIFE_STAGES.dog
export type CatLifeStage = keyof typeof LIFE_STAGES.cat
export type LifeStage = DogLifeStage | CatLifeStage

export const DOG_SIZES = ['toy', 'small', 'medium', 'large', 'giant'] as const
export type DogSize = typeof DOG_SIZES[number]

export const CAT_SIZES = ['small', 'medium', 'large'] as const
export type CatSize = typeof CAT_SIZES[number]

export type PetSize = DogSize | CatSize

export const DOG_SIZE_WEIGHTS = {
  toy: { min: 0, max: 10, label: { en: 'Toy', bg: 'Мини' } },
  small: { min: 10, max: 25, label: { en: 'Small', bg: 'Малко' } },
  medium: { min: 25, max: 50, label: { en: 'Medium', bg: 'Средно' } },
  large: { min: 50, max: 80, label: { en: 'Large', bg: 'Голямо' } },
  giant: { min: 80, max: 200, label: { en: 'Giant', bg: 'Гигантско' } }
} as const

export const CAT_SIZE_WEIGHTS = {
  small: { min: 0, max: 4, label: { en: 'Small', bg: 'Малка' } },
  medium: { min: 4, max: 6, label: { en: 'Medium', bg: 'Средна' } },
  large: { min: 6, max: 12, label: { en: 'Large', bg: 'Голяма' } }
} as const

export function deriveLifeStage(species: Species, ageMonths: number): LifeStage {
  const stages = LIFE_STAGES[species]
  for (const [stage, config] of Object.entries(stages)) {
    if (ageMonths <= config.maxMonths) {
      return stage as LifeStage
    }
  }
  return species === 'dog' ? 'senior' : 'senior'
}

export function deriveSizeFromWeight(species: Species, weightKg: number): PetSize {
  if (species === 'dog') {
    if (weightKg < DOG_SIZE_WEIGHTS.toy.max) return 'toy'
    if (weightKg < DOG_SIZE_WEIGHTS.small.max) return 'small'
    if (weightKg < DOG_SIZE_WEIGHTS.medium.max) return 'medium'
    if (weightKg < DOG_SIZE_WEIGHTS.large.max) return 'large'
    return 'giant'
  } else {
    if (weightKg < CAT_SIZE_WEIGHTS.small.max) return 'small'
    if (weightKg < CAT_SIZE_WEIGHTS.medium.max) return 'medium'
    return 'large'
  }
}
