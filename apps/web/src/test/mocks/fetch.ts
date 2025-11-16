import { vi } from 'vitest';

/**
 * Global fetch mock for testing
 */
export function setupFetchMock(): void {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      bytes: async () => new Uint8Array(),
      headers: new Headers(),
      redirected: false,
      type: 'default' as ResponseType,
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
    } as unknown as Response)
  ) as typeof fetch;
}

