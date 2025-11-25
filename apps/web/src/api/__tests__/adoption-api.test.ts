/**
 * Adoption API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { adoptionApi } from '@/api/adoption-api';
import type { CreateAdoptionProfileRequest } from '@/api/adoption-api';
import type { AdoptionProfile, AdoptionApplication } from '@/lib/adoption-types';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock APIClient - use closure to get port at runtime
let testServerPortForMock = 0;

const createAPIClientMock = () => {
  const makeRequest = async (endpoint: string, method: string, data?: unknown) => {
    // Read port dynamically at request time
    const port = testServerPortForMock;
    if (port === 0) {
      throw new Error('Test server not initialized. Port is 0.');
    }

    const testUrl = `http://localhost:${port}${endpoint}`;
    const response = await fetch(testUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content)
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { data: {} };
    }

    const text = await response.text();
    if (!text) {
      return { data: {} };
    }

    try {
      const json = JSON.parse(text);
      return { data: json.data || json };
    } catch {
      return { data: {} };
    }
  };

  return {
    get: (endpoint: string) => makeRequest(endpoint, 'GET'),
    post: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'POST', data),
    put: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PUT', data),
    patch: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PATCH', data),
    delete: (endpoint: string) => makeRequest(endpoint, 'DELETE'),
  };
};

vi.mock('@/lib/api-client', () => {
  function createAPIClientMock() {
    const makeRequest = async (endpoint: string, method: string, data?: unknown) => {
      const url = new URL(`http://localhost:${testServerPort}${endpoint}`);
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return { data: json.data || json };
      } catch {
        return { data: {} };
      }
    };

    return {
      get: (endpoint: string) => makeRequest(endpoint, 'GET'),
      post: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'POST', data),
      put: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PUT', data),
      patch: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PATCH', data),
      delete: (endpoint: string) => makeRequest(endpoint, 'DELETE'),
    };
  }

  return {
    APIClient: createAPIClientMock(),
  };
});

let server: ReturnType<typeof createServer>;
let testServerPort: number;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const bufferChunk: Buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    chunks.push(bufferChunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
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
};

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
};

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost`);

      // Handle GET /adoption/listings (with or without query params)
      if (req.method === 'GET' && url.pathname === '/adoption/listings') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { profiles: [mockProfile], hasMore: false } }));
        return;
      }

      // Handle GET /adoption/listings/:id
      if (req.method === 'GET' && url.pathname.startsWith('/adoption/listings/')) {
        const id = url.pathname.split('/').pop();
        if (id === 'profile-999') {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: mockProfile }));
        return;
      }

      // Handle POST /adoption/applications
      if (req.method === 'POST' && url.pathname === '/adoption/applications') {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(JSON.stringify({ data: mockApplication }));
        return;
      }

      // Handle GET /adoption/applications (with or without query params)
      if (req.method === 'GET' && url.pathname === '/adoption/applications') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: [mockApplication] }));
        return;
      }

      // Handle POST /adoption/listings
      if (req.method === 'POST' && url.pathname === '/adoption/listings') {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(JSON.stringify({ data: mockProfile }));
        return;
      }

      // Handle PATCH /adoption/listings/:id
      if (req.method === 'PATCH' && url.pathname.startsWith('/adoption/listings/')) {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: { success: true } }));
        return;
      }

      // Handle PATCH /adoption/applications/:id
      if (req.method === 'PATCH' && url.pathname.startsWith('/adoption/applications/')) {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: { success: true } }));
        return;
      }

      // Handle DELETE /adoption/listings/:id
      if (req.method === 'DELETE' && url.pathname.startsWith('/adoption/listings/')) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: { success: true } }));
        return;
      }

      // Handle GET /api/v1/adoption/shelters
      if (req.method === 'GET' && url.pathname === '/api/v1/adoption/shelters') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: [] }));
        return;
      }

      res.statusCode = 404;
      res.end();
    })();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        testServerPort = address.port;
        testServerPortForMock = testServerPort;
        process.env.TEST_API_PORT = String(testServerPort);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      testServerPortForMock = 0;
      resolve();
    });
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AdoptionAPI.getAdoptionProfiles', () => {
  it('should return adoption profiles', async () => {
    const result = await adoptionApi.getAdoptionProfiles();

    expect(result).toMatchObject({
      profiles: expect.any(Array) as unknown[],
      hasMore: expect.any(Boolean) as boolean,
    });
    expect(result.profiles.length).toBeGreaterThanOrEqual(0);
  });

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
    });

    expect(result).toMatchObject({
      profiles: expect.any(Array) as unknown[],
      hasMore: expect.any(Boolean) as boolean,
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(adoptionApi.getAdoptionProfiles()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.getProfileById', () => {
  it('should return profile by id', async () => {
    const profile = await adoptionApi.getProfileById('profile-1');

    expect(profile).toMatchObject({
      _id: 'profile-1',
      petName: expect.any(String) as string,
      breed: expect.any(String) as string,
    });
  });

  it('should return null for non-existent profile', async () => {
    const profile = await adoptionApi.getProfileById('profile-999');

    expect(profile).toBeNull();
  });

  it('should throw on network error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(adoptionApi.getProfileById('profile-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

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
    };

    const application = await adoptionApi.submitApplication(request);

    expect(application).toMatchObject({
      adoptionProfileId: request.adoptionProfileId,
      applicantId: request.applicantId,
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

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
    };

    await expect(adoptionApi.submitApplication(request)).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.getUserApplications', () => {
  it('should return user applications', async () => {
    const applications = await adoptionApi.getUserApplications('user-1');

    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const applications = await adoptionApi.getUserApplications('user-1');

    expect(applications).toEqual([]);

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.getAllApplications', () => {
  it('should return all applications', async () => {
    const applications = await adoptionApi.getAllApplications();

    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const applications = await adoptionApi.getAllApplications();

    expect(applications).toEqual([]);

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.getApplicationsByProfile', () => {
  it('should return applications by profile', async () => {
    const applications = await adoptionApi.getApplicationsByProfile('profile-1');

    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const applications = await adoptionApi.getApplicationsByProfile('profile-1');

    expect(applications).toEqual([]);

    global.fetch = originalFetch;
  });
});

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
    };

    const profile = await adoptionApi.createAdoptionProfile(request);

    expect(profile).toMatchObject({
      petName: request.petName,
      breed: request.breed,
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

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
    };

    await expect(adoptionApi.createAdoptionProfile(request)).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.updateProfileStatus', () => {
  it('should update profile status', async () => {
    await expect(adoptionApi.updateProfileStatus('profile-1', 'adopted')).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(adoptionApi.updateProfileStatus('profile-1', 'adopted')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.updateApplicationStatus', () => {
  it('should update application status', async () => {
    const request = {
      status: 'approved' as const,
      reviewNotes: 'Application approved',
    };

    await expect(adoptionApi.updateApplicationStatus('app-1', request)).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const request = {
      status: 'approved' as const,
    };

    await expect(adoptionApi.updateApplicationStatus('app-1', request)).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AdoptionAPI.getShelters', () => {
  it('should return shelters', async () => {
    const shelters = await adoptionApi.getShelters();

    expect(Array.isArray(shelters)).toBe(true);
  });

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const shelters = await adoptionApi.getShelters();

    expect(shelters).toEqual([]);

    global.fetch = originalFetch;
  });
});
