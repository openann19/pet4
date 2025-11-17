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
  class MockFileReaderClass implements Partial<FileReader> {
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;
    
    readAsDataURL = vi.fn();
    readAsText = vi.fn();
    readAsArrayBuffer = vi.fn();
    result: string | ArrayBuffer | null = null;
    error: DOMException | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    abort = vi.fn();
    readyState: 0 | 1 | 2 = 0;
    
    readonly EMPTY = 0;
    readonly LOADING = 1;
    readonly DONE = 2;
  }

  global.FileReader = MockFileReaderClass as any;
}

