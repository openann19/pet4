import type { Species } from './species'

export interface BreedDefinition {
  id: string
  species: Species
  name: { en: string; bg: string }
  synonyms: string[]
  family?: string
  sizeCategory: string
  typicalWeight: { min: number; max: number }
  temperamentTags: string[]
  energyLevel: number
}

export const DOG_BREEDS: BreedDefinition[] = [
  {
    id: 'dog-golden-retriever',
    species: 'dog',
    name: { en: 'Golden Retriever', bg: 'Голдън ретрийвър' },
    synonyms: ['golden', 'retriever', 'goldie'],
    family: 'sporting',
    sizeCategory: 'large',
    typicalWeight: { min: 25, max: 34 },
    temperamentTags: ['friendly', 'intelligent', 'devoted', 'gentle'],
    energyLevel: 4
  },
  {
    id: 'dog-labrador',
    species: 'dog',
    name: { en: 'Labrador Retriever', bg: 'Лабрадор ретрийвър' },
    synonyms: ['labrador', 'lab', 'lab retriever'],
    family: 'sporting',
    sizeCategory: 'large',
    typicalWeight: { min: 25, max: 36 },
    temperamentTags: ['friendly', 'outgoing', 'active', 'gentle'],
    energyLevel: 5
  },
  {
    id: 'dog-german-shepherd',
    species: 'dog',
    name: { en: 'German Shepherd', bg: 'Немска овчарка' },
    synonyms: ['german shepherd', 'gsd', 'alsatian'],
    family: 'herding',
    sizeCategory: 'large',
    typicalWeight: { min: 22, max: 40 },
    temperamentTags: ['confident', 'courageous', 'intelligent', 'loyal'],
    energyLevel: 5
  },
  {
    id: 'dog-french-bulldog',
    species: 'dog',
    name: { en: 'French Bulldog', bg: 'Френски булдог' },
    synonyms: ['french bulldog', 'frenchie', 'bouledogue francais'],
    family: 'non-sporting',
    sizeCategory: 'small',
    typicalWeight: { min: 8, max: 14 },
    temperamentTags: ['playful', 'adaptable', 'smart', 'affectionate'],
    energyLevel: 2
  },
  {
    id: 'dog-beagle',
    species: 'dog',
    name: { en: 'Beagle', bg: 'Бийгъл' },
    synonyms: ['beagle'],
    family: 'hound',
    sizeCategory: 'small',
    typicalWeight: { min: 9, max: 11 },
    temperamentTags: ['friendly', 'curious', 'merry'],
    energyLevel: 4
  },
  {
    id: 'dog-poodle',
    species: 'dog',
    name: { en: 'Poodle', bg: 'Пудел' },
    synonyms: ['poodle', 'standard poodle', 'toy poodle', 'miniature poodle'],
    family: 'non-sporting',
    sizeCategory: 'medium',
    typicalWeight: { min: 20, max: 32 },
    temperamentTags: ['intelligent', 'active', 'proud'],
    energyLevel: 4
  },
  {
    id: 'dog-bulldog',
    species: 'dog',
    name: { en: 'Bulldog', bg: 'Булдог' },
    synonyms: ['bulldog', 'english bulldog', 'british bulldog'],
    family: 'non-sporting',
    sizeCategory: 'medium',
    typicalWeight: { min: 18, max: 25 },
    temperamentTags: ['calm', 'courageous', 'friendly', 'dignified'],
    energyLevel: 2
  },
  {
    id: 'dog-rottweiler',
    species: 'dog',
    name: { en: 'Rottweiler', bg: 'Ротвайлер' },
    synonyms: ['rottweiler', 'rottie', 'rott'],
    family: 'working',
    sizeCategory: 'large',
    typicalWeight: { min: 35, max: 60 },
    temperamentTags: ['confident', 'loyal', 'protective', 'courageous'],
    energyLevel: 4
  },
  {
    id: 'dog-siberian-husky',
    species: 'dog',
    name: { en: 'Siberian Husky', bg: 'Сибирски хъски' },
    synonyms: ['husky', 'siberian husky'],
    family: 'working',
    sizeCategory: 'medium',
    typicalWeight: { min: 16, max: 27 },
    temperamentTags: ['outgoing', 'alert', 'gentle', 'friendly'],
    energyLevel: 5
  },
  {
    id: 'dog-chihuahua',
    species: 'dog',
    name: { en: 'Chihuahua', bg: 'Чихуахуа' },
    synonyms: ['chihuahua', 'chi'],
    family: 'toy',
    sizeCategory: 'toy',
    typicalWeight: { min: 1.5, max: 3 },
    temperamentTags: ['charming', 'graceful', 'sassy'],
    energyLevel: 3
  },
  {
    id: 'dog-mixed',
    species: 'dog',
    name: { en: 'Mixed Breed', bg: 'Миксирана порода' },
    synonyms: ['mixed', 'mutt', 'crossbreed', 'mongrel', 'unknown'],
    family: 'mixed',
    sizeCategory: 'medium',
    typicalWeight: { min: 10, max: 30 },
    temperamentTags: ['friendly', 'adaptable'],
    energyLevel: 3
  }
]

export const CAT_BREEDS: BreedDefinition[] = [
  {
    id: 'cat-persian',
    species: 'cat',
    name: { en: 'Persian', bg: 'Персийска' },
    synonyms: ['persian', 'longhair'],
    sizeCategory: 'medium',
    typicalWeight: { min: 3.5, max: 5.5 },
    temperamentTags: ['gentle', 'quiet', 'sweet'],
    energyLevel: 2
  },
  {
    id: 'cat-maine-coon',
    species: 'cat',
    name: { en: 'Maine Coon', bg: 'Мейн кун' },
    synonyms: ['maine coon', 'coon cat'],
    sizeCategory: 'large',
    typicalWeight: { min: 5.5, max: 8 },
    temperamentTags: ['friendly', 'sociable', 'intelligent'],
    energyLevel: 3
  },
  {
    id: 'cat-siamese',
    species: 'cat',
    name: { en: 'Siamese', bg: 'Сиамска' },
    synonyms: ['siamese'],
    sizeCategory: 'small',
    typicalWeight: { min: 2.5, max: 4.5 },
    temperamentTags: ['vocal', 'social', 'intelligent', 'demanding'],
    energyLevel: 4
  },
  {
    id: 'cat-british-shorthair',
    species: 'cat',
    name: { en: 'British Shorthair', bg: 'Британска къскосръста' },
    synonyms: ['british shorthair', 'british blue', 'bsh'],
    sizeCategory: 'medium',
    typicalWeight: { min: 4, max: 7 },
    temperamentTags: ['easygoing', 'calm', 'affectionate'],
    energyLevel: 2
  },
  {
    id: 'cat-ragdoll',
    species: 'cat',
    name: { en: 'Ragdoll', bg: 'Рагдол' },
    synonyms: ['ragdoll'],
    sizeCategory: 'large',
    typicalWeight: { min: 4.5, max: 9 },
    temperamentTags: ['docile', 'placid', 'affectionate'],
    energyLevel: 2
  },
  {
    id: 'cat-bengal',
    species: 'cat',
    name: { en: 'Bengal', bg: 'Бенгалска' },
    synonyms: ['bengal'],
    sizeCategory: 'medium',
    typicalWeight: { min: 4, max: 7 },
    temperamentTags: ['active', 'intelligent', 'curious', 'playful'],
    energyLevel: 5
  },
  {
    id: 'cat-russian-blue',
    species: 'cat',
    name: { en: 'Russian Blue', bg: 'Руска синя' },
    synonyms: ['russian blue', 'archangel blue'],
    sizeCategory: 'small',
    typicalWeight: { min: 3, max: 5.5 },
    temperamentTags: ['quiet', 'intelligent', 'shy'],
    energyLevel: 3
  },
  {
    id: 'cat-sphynx',
    species: 'cat',
    name: { en: 'Sphynx', bg: 'Сфинкс' },
    synonyms: ['sphynx', 'canadian sphynx', 'hairless'],
    sizeCategory: 'medium',
    typicalWeight: { min: 3, max: 5 },
    temperamentTags: ['energetic', 'loyal', 'curious'],
    energyLevel: 4
  },
  {
    id: 'cat-mixed',
    species: 'cat',
    name: { en: 'Mixed Breed', bg: 'Миксирана порода' },
    synonyms: ['mixed', 'domestic shorthair', 'domestic longhair', 'dsh', 'dlh', 'unknown'],
    sizeCategory: 'medium',
    typicalWeight: { min: 3.5, max: 5.5 },
    temperamentTags: ['friendly', 'adaptable'],
    energyLevel: 3
  }
]

export const ALL_BREEDS = [...DOG_BREEDS, ...CAT_BREEDS]

export function findBreedByName(species: Species, breedName: string): BreedDefinition | undefined {
  const normalized = breedName.toLowerCase().trim()
  const breeds = species === 'dog' ? DOG_BREEDS : CAT_BREEDS
  
  return breeds.find(breed => 
    breed.name.en.toLowerCase() === normalized ||
    breed.name.bg.toLowerCase() === normalized ||
    breed.synonyms.some(syn => syn.toLowerCase() === normalized)
  )
}

export function getBreedById(breedId: string): BreedDefinition | undefined {
  return ALL_BREEDS.find(b => b.id === breedId)
}
