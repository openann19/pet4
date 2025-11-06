/**
 * Adoption API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { adoptionApi } from '@/api/adoption-api'
import type { CreateAdoptionProfileRequest } from '@/api/adoption-api'
import type { AdoptionProfile, AdoptionApplication } from '@/lib/adoption-types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockProfile: AdoptionProfile = {
  _id: 'profile-1',
  petId: 'pet-1',
  petName: 'Buddy',
  petPhoto: 'https://example.com/photo.jpg',
  breed: 'Golden Retriever',
  age: 2,
  gender: 'male',
  size: 'large',
  status: 'available',
  location: 'San Francisco, CA',
  description: 'Friendly dog',
  photos: [],
  postedDate: new Date().toISOString(),
  shelterId: 'shelter-1',
  shelterName: 'SF Animal Shelter',
  healthStatus: 'healthy',
  vaccinated: true,
  spayedNeutered: true,
  goodWithKids: true,
  goodWithPets: true,
  energyLevel: 'medium',
  adoptionFee: 100,
  personality: [],
  contactEmail: 'shelter@example.com',
}

const mockApplication: AdoptionApplication = {
  _id: 'app-1',
  adoptionProfileId: 'profile-1',
  applicantId: 'user-1',
  applicantName: 'John Doe',
  applicantEmail: 'john@example.com',
  applicantPhone: '555-1234',
  status: 'pending',
  householdType: 'house',
  hasYard: true,
  hasOtherPets: false,
  hasChildren: false,
  experience: '5 years',
  reason: 'Looking for a companion',
  submittedAt: new Date().toISOString(),
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'GET' && url.pathname === '/adoption/listings') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { profiles: [mockProfile], hasMore: false } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/adoption/listings/profile-1') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: mockProfile }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/adoption/listings/profile-999') {
      res.statusCode = 404
      res.end()
      return
    }

    if (req.method === 'POST' && url.pathname === '/adoption/applications') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: mockApplication }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/adoption/applications') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: [mockApplication] }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/adoption/listings') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: mockProfile }))
      return
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/adoption/listings/')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/adoption/applications/')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/adoption/shelters') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: [] }))
      return
    }

    res.statusCode = 404
    res.end()
  })

  await new Promise<void>(resolve => {
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        process.env['TEST_API_PORT'] = String(address.port)
      }
      resolve()
    })
  })
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdoptionAPI.getAdoptionProfiles', () => {
  it('should return adoption profiles', async () => {
    const result = await adoptionApi.getAdoptionProfiles()

    expect(result).toMatchObject({
      profiles: expect.any(Array),
      hasMore: expect.any(Boolean),
    })
    expect(result.profiles.length).toBeGreaterThanOrEqual(0)
  })

  it('should apply filters', async () => {
    const result = await adoptionApi.getAdoptionProfiles({
      status: 'available',
      breed: 'Golden Retriever',
      minAge: 1,
      maxAge: 5,
      size: ['large'],
      location: 'San Francisco',
      goodWithKids: true,
      goodWithPets: true,
      cursor: 'cursor-1',
      limit: 20,
    })

    expect(result).toMatchObject({
      profiles: expect.any(Array),
      hasMore: expect.any(Boolean),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(adoptionApi.getAdoptionProfiles()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.getProfileById', () => {
  it('should return profile by id', async () => {
    const profile = await adoptionApi.getProfileById('profile-1')

    expect(profile).toMatchObject({
      _id: 'profile-1',
      petName: expect.any(String),
      breed: expect.any(String),
    })
  })

  it('should return null for non-existent profile', async () => {
    const profile = await adoptionApi.getProfileById('profile-999')

    expect(profile).toBeNull()
  })

  it('should throw on network error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(adoptionApi.getProfileById('profile-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.submitApplication', () => {
  it('should submit application successfully', async () => {
    const request = {
      adoptionProfileId: 'profile-1',
      applicantId: 'user-1',
      applicantName: 'John Doe',
      applicantEmail: 'john@example.com',
      applicantPhone: '555-1234',
      householdType: 'house' as const,
      hasYard: true,
      hasOtherPets: false,
      hasChildren: false,
      experience: '5 years',
      reason: 'Looking for a companion',
    }

    const application = await adoptionApi.submitApplication(request)

    expect(application).toMatchObject({
      adoptionProfileId: request.adoptionProfileId,
      applicantId: request.applicantId,
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const request = {
      adoptionProfileId: 'profile-1',
      applicantId: 'user-1',
      applicantName: 'John Doe',
      applicantEmail: 'john@example.com',
      applicantPhone: '555-1234',
      householdType: 'house' as const,
      hasYard: true,
      hasOtherPets: false,
      hasChildren: false,
      experience: '5 years',
      reason: 'Looking for a companion',
    }

    await expect(adoptionApi.submitApplication(request)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.getUserApplications', () => {
  it('should return user applications', async () => {
    const applications = await adoptionApi.getUserApplications('user-1')

    expect(Array.isArray(applications)).toBe(true)
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const applications = await adoptionApi.getUserApplications('user-1')

    expect(applications).toEqual([])

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.getAllApplications', () => {
  it('should return all applications', async () => {
    const applications = await adoptionApi.getAllApplications()

    expect(Array.isArray(applications)).toBe(true)
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const applications = await adoptionApi.getAllApplications()

    expect(applications).toEqual([])

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.getApplicationsByProfile', () => {
  it('should return applications by profile', async () => {
    const applications = await adoptionApi.getApplicationsByProfile('profile-1')

    expect(Array.isArray(applications)).toBe(true)
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const applications = await adoptionApi.getApplicationsByProfile('profile-1')

    expect(applications).toEqual([])

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.createAdoptionProfile', () => {
  it('should create adoption profile', async () => {
    const request: CreateAdoptionProfileRequest = {
      petId: 'pet-1',
      petName: 'Buddy',
      petPhoto: 'https://example.com/photo.jpg',
      breed: 'Golden Retriever',
      age: 2,
      gender: 'male',
      size: 'large',
      status: 'available',
      location: 'San Francisco, CA',
      description: 'Friendly dog',
      photos: [],
      shelterId: 'shelter-1',
      shelterName: 'SF Animal Shelter',
      healthStatus: 'healthy',
      vaccinated: true,
      spayedNeutered: true,
      goodWithKids: true,
      goodWithPets: true,
      energyLevel: 'medium',
      adoptionFee: 100,
      personality: [],
      contactEmail: 'shelter@example.com',
    }

    const profile = await adoptionApi.createAdoptionProfile(request)

    expect(profile).toMatchObject({
      petName: request.petName,
      breed: request.breed,
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const request: CreateAdoptionProfileRequest = {
      petId: 'pet-1',
      petName: 'Buddy',
      petPhoto: 'https://example.com/photo.jpg',
      breed: 'Golden Retriever',
      age: 2,
      gender: 'male',
      size: 'large',
      status: 'available',
      location: 'San Francisco, CA',
      description: 'Friendly dog',
      photos: [],
      shelterId: 'shelter-1',
      shelterName: 'SF Animal Shelter',
      healthStatus: 'healthy',
      vaccinated: true,
      spayedNeutered: true,
      goodWithKids: true,
      goodWithPets: true,
      energyLevel: 'medium',
      adoptionFee: 100,
      personality: [],
      contactEmail: 'shelter@example.com',
    }

    await expect(adoptionApi.createAdoptionProfile(request)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.updateProfileStatus', () => {
  it('should update profile status', async () => {
    await expect(adoptionApi.updateProfileStatus('profile-1', 'adopted')).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(adoptionApi.updateProfileStatus('profile-1', 'adopted')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.updateApplicationStatus', () => {
  it('should update application status', async () => {
    const request = {
      status: 'approved' as const,
      reviewNotes: 'Application approved',
    }

    await expect(adoptionApi.updateApplicationStatus('app-1', request)).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const request = {
      status: 'approved' as const,
    }

    await expect(adoptionApi.updateApplicationStatus('app-1', request)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdoptionAPI.getShelters', () => {
  it('should return shelters', async () => {
    const shelters = await adoptionApi.getShelters()

    expect(Array.isArray(shelters)).toBe(true)
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const shelters = await adoptionApi.getShelters()

    expect(shelters).toEqual([])

    global.fetch = originalFetch
  })
})

