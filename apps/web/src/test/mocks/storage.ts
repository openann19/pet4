/**
 * Storage Mock Utilities
 *
 * Mock utilities for IndexedDB and localStorage in tests
 */

import { vi } from 'vitest';

/**
 * Mock localStorage
 */
export const createMockLocalStorage = (): Storage => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

/**
 * Mock IndexedDB
 */
export interface MockIDBObjectStore {
  add: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  openCursor: ReturnType<typeof vi.fn>;
}

export interface MockIDBTransaction {
  objectStore: (name: string) => MockIDBObjectStore;
  abort: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
}

export interface MockIDBDatabase {
  transaction: (stores: string | string[], mode?: IDBTransactionMode) => MockIDBTransaction;
  createObjectStore: ReturnType<typeof vi.fn>;
  deleteObjectStore: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

export interface MockIDBRequest<T = unknown> extends EventTarget {
  result: T | undefined;
  error: DOMException | null;
  readyState: IDBRequestReadyState;
  onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
  onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
}

export function createMockIDBRequest<T = unknown>(result?: T): MockIDBRequest<T> {
  const request = {
    result,
    error: null,
    readyState: 'done' as IDBRequestReadyState,
    onsuccess: null,
    onerror: null,
    source: null as any, // Mock source
    transaction: null as any, // Mock transaction
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MockIDBRequest<T>;

  // Simulate success
  setTimeout(() => {
    if (request.onsuccess) {
      request.onsuccess.call(request as any, new Event('success') as any);
    }
  }, 0);

  return request;
}

export function createMockIDBDatabase(): MockIDBDatabase {
  const stores: Record<string, Record<string, unknown>> = {};

  const createObjectStore = vi.fn((name: string) => {
    stores[name] = {};
    return {
      createIndex: vi.fn(),
    };
  });

  const objectStore = (name: string): MockIDBObjectStore => {
    if (!stores[name]) {
      stores[name] = {};
    }
    const store = stores[name];

    return {
      add: vi.fn((value: unknown) => {
        const key = `key_${Object.keys(store).length}`;
        store[key] = value;
        return createMockIDBRequest(key);
      }),
      put: vi.fn((value: unknown, key?: string) => {
        const storeKey = key ?? `key_${Object.keys(store).length}`;
        store[storeKey] = value;
        return createMockIDBRequest(storeKey);
      }),
      get: vi.fn((key: string) => createMockIDBRequest(store[key])),
      delete: vi.fn((key: string) => {
        delete store[key];
        return createMockIDBRequest(undefined);
      }),
      getAll: vi.fn(() => createMockIDBRequest(Object.values(store))),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
        return createMockIDBRequest(undefined);
      }),
      openCursor: vi.fn(() => createMockIDBRequest(null)),
    };
  };

  return {
    transaction: vi.fn((stores: string | string[]) => ({
      objectStore: (name: string) => objectStore(name),
      abort: vi.fn(),
      commit: vi.fn(),
    })),
    createObjectStore,
    deleteObjectStore: vi.fn(),
    close: vi.fn(),
  };
}

/**
 * Setup storage mocks globally
 */
export function setupStorageMocks(): void {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: createMockLocalStorage(),
  });

  // Mock IndexedDB
  const mockOpen = vi.fn((name: string) => {
    const db = createMockIDBDatabase();
    return createMockIDBRequest(db);
  });

  Object.defineProperty(window, 'indexedDB', {
    writable: true,
    value: {
      open: mockOpen,
      deleteDatabase: vi.fn(() => createMockIDBRequest(undefined)),
      databases: vi.fn(() => Promise.resolve([])),
    },
  });
}
