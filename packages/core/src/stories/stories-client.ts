/**
 * Stories Client
 *
 * API client for stories system
 */

import type {
  Story,
  StoryHighlight,
  CreateStoryRequest,
  CreateStoryResponse,
  GetStoriesResponse,
  GetHighlightsResponse,
} from './stories-types';

export interface StoriesClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class StoriesClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'StoriesClientError';
  }
}

export class StoriesClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: StoriesClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api/stories';
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getStories(signal?: AbortSignal): Promise<Story[]> {
    const res = await this.fetchImpl(`${this.baseUrl}`, { signal });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to load stories (${res.status})`, res.status);
    }

    const data = (await res.json()) as GetStoriesResponse;
    return data.stories;
  }

  async getStory(storyId: string, signal?: AbortSignal): Promise<Story> {
    const res = await this.fetchImpl(`${this.baseUrl}/${storyId}`, { signal });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to load story (${res.status})`, res.status);
    }

    const data = (await res.json()) as { story: Story };
    return data.story;
  }

  async createStory(request: CreateStoryRequest, signal?: AbortSignal): Promise<Story> {
    const res = await this.fetchImpl(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to create story (${res.status})`, res.status);
    }

    const data = (await res.json()) as CreateStoryResponse;
    return data.story;
  }

  async deleteStory(storyId: string, signal?: AbortSignal): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${storyId}`, {
      method: 'DELETE',
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to delete story (${res.status})`, res.status);
    }
  }

  async addStoryView(
    storyId: string,
    userId: string,
    viewDuration?: number,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${storyId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, viewDuration }),
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to add story view (${res.status})`, res.status);
    }
  }

  async addStoryReaction(
    storyId: string,
    emoji: string,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/${storyId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emoji }),
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to add reaction (${res.status})`, res.status);
    }
  }

  async getHighlights(userId: string, signal?: AbortSignal): Promise<StoryHighlight[]> {
    const res = await this.fetchImpl(`${this.baseUrl}/highlights?userId=${userId}`, {
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to load highlights (${res.status})`, res.status);
    }

    const data = (await res.json()) as GetHighlightsResponse;
    return data.highlights;
  }

  async createHighlight(
    title: string,
    coverImage: string,
    storyIds: string[],
    signal?: AbortSignal
  ): Promise<StoryHighlight> {
    const res = await this.fetchImpl(`${this.baseUrl}/highlights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, coverImage, storyIds }),
      signal,
    });

    if (!res.ok) {
      throw new StoriesClientError(`Failed to create highlight (${res.status})`, res.status);
    }

    const data = (await res.json()) as { highlight: StoryHighlight };
    return data.highlight;
  }
}

export const storiesClient = new StoriesClient();

