import { vi } from 'vitest';

interface FileInit {
  type?: string;
  lastModified?: number;
}

interface MockFileReaderInstance {
  readAsDataURL: ReturnType<typeof vi.fn>;
  readAsText: ReturnType<typeof vi.fn>;
  readAsArrayBuffer: ReturnType<typeof vi.fn>;
  result: string | ArrayBuffer | null;
  error: DOMException | null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  abort: ReturnType<typeof vi.fn>;
  EMPTY: number;
  LOADING: number;
  DONE: number;
  readyState: number;
}

/**
 * File API mocks for testing
 */
export function setupFileAPIMocks(): void {
  // Mock File
  global.File = vi.fn().mockImplementation((chunks: unknown[], filename: string, options?: FileInit) => ({
    name: filename,
    size: chunks.reduce((acc: number, chunk: unknown) => {
      const chunkLength = (chunk as { length?: number })?.length ?? 0;
      return acc + chunkLength;
    }, 0),
    type: options?.type ?? '',
    lastModified: Date.now(),
  })) as typeof File;

  // Mock FileReader
  const MockFileReader = vi.fn().mockImplementation((): MockFileReaderInstance => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    abort: vi.fn(),
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    readyState: 0,
  }));

  MockFileReader.EMPTY = 0;
  MockFileReader.LOADING = 1;
  MockFileReader.DONE = 2;

  global.FileReader = MockFileReader;
}

