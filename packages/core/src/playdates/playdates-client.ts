/**
 * Playdates Client
 *
 * API client for playdates system
 */

import type {
  Playdate,
  CreatePlaydateRequest,
  CreatePlaydateResponse,
  GetPlaydatesResponse,
  JoinPlaydateResponse,
} from './playdates-types';

export interface PlaydatesClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class PlaydatesClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'PlaydatesClientError';
  }
}

export class PlaydatesClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PlaydatesClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api/playdates';
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getPlaydates(signal?: AbortSignal): Promise<Playdate[]> {
    const res = await this.fetchImpl(`${this.baseUrl}`, { signal });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to load playdates (${res.status})`, res.status);
    }

    const data = (await res.json()) as GetPlaydatesResponse;
    return data.playdates;
  }

  async getPlaydate(playdateId: string, signal?: AbortSignal): Promise<Playdate> {
    const res = await this.fetchImpl(`${this.baseUrl}/${playdateId}`, { signal });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to load playdate (${res.status})`, res.status);
    }

    const data = (await res.json()) as { playdate: Playdate };
    return data.playdate;
  }

  async createPlaydate(request: CreatePlaydateRequest, signal?: AbortSignal): Promise<Playdate> {
    const res = await this.fetchImpl(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to create playdate (${res.status})`, res.status);
    }

    const data = (await res.json()) as CreatePlaydateResponse;
    return data.playdate;
  }

  async joinPlaydate(playdateId: string, signal?: AbortSignal): Promise<Playdate> {
    const res = await this.fetchImpl(`${this.baseUrl}/${playdateId}/join`, {
      method: 'POST',
      signal,
    });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to join playdate (${res.status})`, res.status);
    }

    const data = (await res.json()) as JoinPlaydateResponse;
    return data.playdate;
  }

  async leavePlaydate(playdateId: string, signal?: AbortSignal): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${playdateId}/leave`, {
      method: 'POST',
      signal,
    });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to leave playdate (${res.status})`, res.status);
    }
  }

  async checkIn(playdateId: string, signal?: AbortSignal): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${playdateId}/check-in`, {
      method: 'POST',
      signal,
    });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to check in (${res.status})`, res.status);
    }
  }

  async cancelPlaydate(playdateId: string, reason?: string, signal?: AbortSignal): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${playdateId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
      signal,
    });

    if (!res.ok) {
      throw new PlaydatesClientError(`Failed to cancel playdate (${res.status})`, res.status);
    }
  }
}

export const playdatesClient = new PlaydatesClient();

