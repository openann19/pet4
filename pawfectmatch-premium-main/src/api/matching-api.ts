import type { PetProfile, OwnerPreferences, SwipeRecord, MatchRecord } from '@/core/domain/pet-model'
import type { MatchScore, HardGateResult } from '@/core/domain/matching-engine'
import type { MatchingConfig } from '@/core/domain/matching-config'
import type { Report, ReportReason, Match } from '@/lib/contracts'
import { evaluateHardGates, calculateMatchScore } from '@/core/domain/matching-engine'
import { DEFAULT_MATCHING_WEIGHTS, DEFAULT_HARD_GATES } from '@/core/domain/matching-config'
import { generateULID } from '@/lib/utils'
import { getRealtimeEvents } from '@/lib/realtime-events'
import type { UpdateOwnerPreferencesData, UpdateMatchingConfigData } from '@/api/types'

export interface DiscoverRequest {
  petId: string
  filters?: {
    species?: string[]
    minAge?: number
    maxAge?: number
    maxDistance?: number
    intents?: string[]
  }
  pageCursor?: string
  pageSize?: number
}

export interface DiscoverResponse {
  candidates: Array<{
    pet: PetProfile
    score: number
    distance: number
  }>
  nextCursor?: string
  totalCount: number
}

export interface ScoreRequest {
  petId1: string
  petId2: string
}

export interface ScoreResponse {
  score: MatchScore
  hardGates: HardGateResult
  canMatch: boolean
}

export interface SwipeRequest {
  petId: string
  targetPetId: string
  action: 'like' | 'pass' | 'superlike'
}

export interface SwipeResponse {
  recorded: boolean
  isMatch: boolean
  matchId?: string
  chatRoomId?: string
}

export interface ReportRequest {
  reporterPetId: string
  reportedPetId: string
  reason: string
  details?: string
}

export class MatchingAPI {
  private configCache: MatchingConfig | null = null

  async discover(request: DiscoverRequest): Promise<DiscoverResponse> {
    const pet = await this.getPet(request.petId)
    if (!pet) {
      throw new Error('Pet not found')
    }

    const prefs = await this.getPreferences(pet.ownerId)
    const config = await this.getConfig()

    const allPets = await this.getAllPets()
    
    const candidates: Array<{ pet: PetProfile; score: number; distance: number }> = []

    for (const candidate of allPets) {
      if (candidate.id === pet.id || !candidate.isActive) continue

      const hardGates = evaluateHardGates(pet, candidate, prefs, config.hardGates)
      
      if (!hardGates.passed) continue

      const hasSwipedBefore = await this.hasSwipedBefore(pet.id, candidate.id)
      if (hasSwipedBefore) continue

      const matchScore = calculateMatchScore(pet, candidate, config.weights)
      
      const distance = this.calculateDistance(
        pet.location.roundedLat,
        pet.location.roundedLng,
        candidate.location.roundedLat,
        candidate.location.roundedLng
      )

      candidates.push({
        pet: candidate,
        score: matchScore.totalScore,
        distance
      })
    }

    candidates.sort((a, b) => b.score - a.score)

    const pageSize = request.pageSize || 20
    const startIndex = request.pageCursor ? parseInt(request.pageCursor, 10) : 0
    const endIndex = startIndex + pageSize

    const page = candidates.slice(startIndex, endIndex)
    const nextCursor = endIndex < candidates.length ? endIndex.toString() : undefined

    return {
      candidates: page,
      nextCursor,
      totalCount: candidates.length
    }
  }

  async score(request: ScoreRequest): Promise<ScoreResponse> {
    const pet1 = await this.getPet(request.petId1)
    const pet2 = await this.getPet(request.petId2)

    if (!pet1 || !pet2) {
      throw new Error('One or both pets not found')
    }

    const prefs1 = await this.getPreferences(pet1.ownerId)
    const config = await this.getConfig()

    const hardGates = evaluateHardGates(pet1, pet2, prefs1, config.hardGates)
    const score = calculateMatchScore(pet1, pet2, config.weights)

    return {
      score,
      hardGates,
      canMatch: hardGates.passed
    }
  }

  async swipe(request: SwipeRequest): Promise<SwipeResponse> {
    const swipeRecord: SwipeRecord = {
      id: generateULID(),
      petId: request.petId,
      targetPetId: request.targetPetId,
      action: request.action,
      timestamp: new Date().toISOString()
    }

    await this.recordSwipe(swipeRecord)

    if (request.action === 'like' || request.action === 'superlike') {
      const realtimeEvents = getRealtimeEvents()
      
      await realtimeEvents.notifyLikeReceived(request.petId, request.targetPetId).catch((error) => {
        const logger = require('@/lib/logger').createLogger('MatchingAPI')
        logger.error('Failed to emit like_received event', error instanceof Error ? error : new Error(String(error)))
      })

      const mutualLike = await this.checkMutualLike(request.petId, request.targetPetId)                                                                         
      
      if (mutualLike) {
        const matchId = generateULID()
        const chatRoomId = generateULID()

        const pet1 = await this.getPet(request.petId)
        const pet2 = await this.getPet(request.targetPetId)

        if (pet1 && pet2) {
          const config = await this.getConfig()
          const matchScore = calculateMatchScore(pet1, pet2, config.weights)

          const matchRecord: MatchRecord = {
            id: matchId,
            petId1: request.petId,
            petId2: request.targetPetId,
            score: matchScore.totalScore,
            matchedAt: new Date().toISOString(),
            status: 'active',
            chatRoomId
          }

          await this.recordMatch(matchRecord)

          await this.createChatRoom(chatRoomId, request.petId, request.targetPetId)

          const match: Match = {
            id: matchId,
            petAId: request.petId,
            petBId: request.targetPetId,
            compatibilityScore: matchScore.totalScore,
            compatibilityBreakdown: {
              personality: matchScore.factorScores.temperamentFit,
              interests: matchScore.factorScores.intentMatch,
              size: matchScore.factorScores.sizeCompatibility,
              age: matchScore.factorScores.lifeStageProximity,
              location: matchScore.factorScores.distance,
              overall: matchScore.totalScore
            },
            status: 'active',
            chatRoomId,
            createdAt: new Date().toISOString(),
            lastInteractionAt: new Date().toISOString()
          }

          const realtimeEvents = getRealtimeEvents()
          await realtimeEvents.notifyMatchCreated(match).catch((error) => {
            const logger = require('@/lib/logger').createLogger('MatchingAPI')
            logger.error('Failed to emit match_created event', error instanceof Error ? error : new Error(String(error)))
          })

          return {
            recorded: true,
            isMatch: true,
            matchId,
            chatRoomId
          }
        }
      }
    }

    return {
      recorded: true,
      isMatch: false
    }
  }

  async getMatches(petId: string): Promise<MatchRecord[]> {
    const allMatches = await this.getAllMatches()
    return allMatches.filter(
      m => (m.petId1 === petId || m.petId2 === petId) && m.status === 'active'
    )
  }

  async getPreferences(ownerId: string): Promise<OwnerPreferences> {
    const stored = await window.spark.kv.get<OwnerPreferences>(`prefs:${ownerId}`)
    if (stored) return stored

    const defaultPrefs: OwnerPreferences = {
      ownerId,
      maxDistanceKm: 50,
      speciesAllowed: ['dog', 'cat'],
      allowCrossSpecies: false,
      sizesCompatible: [],
      intentsAllowed: ['playdate', 'companionship'],
      requireVaccinations: true,
      globalSearch: false,
      updatedAt: new Date().toISOString()
    }

    await window.spark.kv.set(`prefs:${ownerId}`, defaultPrefs)
    return defaultPrefs
  }

  async updatePreferences(
    ownerId: string,
    data: UpdateOwnerPreferencesData
  ): Promise<OwnerPreferences> {
    const existing = await this.getPreferences(ownerId)

    // Update fields - undefined explicitly means "clear this field"
    const updated: OwnerPreferences = {
      ...existing,
      maxDistanceKm: data.maxDistanceKm !== undefined ? (data.maxDistanceKm ?? existing.maxDistanceKm) : existing.maxDistanceKm,
      speciesAllowed: data.speciesAllowed !== undefined ? (data.speciesAllowed ?? existing.speciesAllowed) : existing.speciesAllowed,
      allowCrossSpecies: data.allowCrossSpecies !== undefined ? (data.allowCrossSpecies ?? existing.allowCrossSpecies) : existing.allowCrossSpecies,
      sizesCompatible: data.sizesCompatible !== undefined ? (data.sizesCompatible ?? existing.sizesCompatible) : existing.sizesCompatible,
      intentsAllowed: data.intentsAllowed !== undefined ? (data.intentsAllowed ?? existing.intentsAllowed) : existing.intentsAllowed,
      requireVaccinations: data.requireVaccinations !== undefined ? (data.requireVaccinations ?? existing.requireVaccinations) : existing.requireVaccinations,
      globalSearch: data.globalSearch !== undefined ? (data.globalSearch ?? existing.globalSearch) : existing.globalSearch,
      updatedAt: new Date().toISOString()
    }

    await window.spark.kv.set(`prefs:${ownerId}`, updated)
    return updated
  }

  async reportPet(request: ReportRequest): Promise<void> {
    const reportId = generateULID()
    const now = new Date().toISOString()
    const report: Report = {
      id: reportId,
      reporterId: request.reporterPetId,
      reportedEntityType: 'pet',
      reportedEntityId: request.reportedPetId,
      reason: request.reason as ReportReason,
      details: request.details || '',
      status: 'pending',
      createdAt: now
    }

    const reports = (await window.spark.kv.get<Report[]>('reports')) || []
    reports.push(report)
    await window.spark.kv.set('reports', reports)
  }

  private async getConfig(): Promise<MatchingConfig> {
    if (this.configCache) return this.configCache

    const stored = await window.spark.kv.get<MatchingConfig>('matching-config')
    if (stored) {
      this.configCache = stored
      return stored
    }

    const defaultConfig: MatchingConfig = {
      id: 'default',
      weights: DEFAULT_MATCHING_WEIGHTS,
      hardGates: DEFAULT_HARD_GATES,
      featureFlags: {
        MATCH_ALLOW_CROSS_SPECIES: false,
        MATCH_REQUIRE_VACCINATION: true,
        MATCH_DISTANCE_MAX_KM: 50,
        MATCH_AB_TEST_KEYS: [],
        MATCH_AI_HINTS_ENABLED: true
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }

    await window.spark.kv.set('matching-config', defaultConfig)
    this.configCache = defaultConfig
    return defaultConfig
  }

  async updateConfig(
    data: UpdateMatchingConfigData
  ): Promise<MatchingConfig> {
    const existing = await this.getConfig()

    // Update fields - undefined explicitly means "clear this field"
    const updated: MatchingConfig = {
      ...existing,
      weights: data.weights !== undefined ? (data.weights ?? existing.weights) : existing.weights,
      hardGates: data.hardGates !== undefined ? (data.hardGates ?? existing.hardGates) : existing.hardGates,
      featureFlags: data.featureFlags !== undefined ? (data.featureFlags ?? existing.featureFlags) : existing.featureFlags,
      updatedAt: new Date().toISOString(),
      updatedBy: existing.updatedBy
    }

    await window.spark.kv.set('matching-config', updated)
    this.configCache = updated
    return updated
  }

  private async getPet(petId: string): Promise<PetProfile | null> {
    return await window.spark.kv.get<PetProfile>(`pet:${petId}`) || null
  }

  private async getAllPets(): Promise<PetProfile[]> {
    const keys = await window.spark.kv.keys()
    const petKeys = keys.filter(k => k.startsWith('pet:'))
    
    const pets: PetProfile[] = []
    for (const key of petKeys) {
      const pet = await window.spark.kv.get<PetProfile>(key)
      if (pet) pets.push(pet)
    }
    
    return pets
  }

  private async recordSwipe(swipe: SwipeRecord): Promise<void> {
    const key = `swipe:${swipe.petId}:${swipe.targetPetId}`
    await window.spark.kv.set(key, swipe)
  }

  private async hasSwipedBefore(petId: string, targetPetId: string): Promise<boolean> {
    const key = `swipe:${petId}:${targetPetId}`
    const swipe = await window.spark.kv.get<SwipeRecord>(key)
    return !!swipe
  }

  private async checkMutualLike(petId: string, targetPetId: string): Promise<boolean> {
    const reverseKey = `swipe:${targetPetId}:${petId}`
    const reverseSwipe = await window.spark.kv.get<SwipeRecord>(reverseKey)
    return reverseSwipe?.action === 'like' || reverseSwipe?.action === 'superlike'
  }

  private async recordMatch(match: MatchRecord): Promise<void> {
    await window.spark.kv.set(`match:${match.id}`, match)
    
    const matches = (await window.spark.kv.get<string[]>('all-matches')) || []
    matches.push(match.id)
    await window.spark.kv.set('all-matches', matches)
  }

  private async getAllMatches(): Promise<MatchRecord[]> {
    const matchIds = (await window.spark.kv.get<string[]>('all-matches')) || []
    const matches: MatchRecord[] = []
    
    for (const id of matchIds) {
      const match = await window.spark.kv.get<MatchRecord>(`match:${id}`)
      if (match) matches.push(match)
    }
    
    return matches
  }

  private async createChatRoom(chatRoomId: string, petId1: string, petId2: string): Promise<void> {
    const chatRoom = {
      id: chatRoomId,
      petId1,
      petId2,
      createdAt: new Date().toISOString(),
      messages: []
    }
    await window.spark.kv.set(`chatroom:${chatRoomId}`, chatRoom)
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const matchingAPI = new MatchingAPI()
