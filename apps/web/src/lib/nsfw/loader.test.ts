import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadNSFWModel, classify, __resetForTests } from './loader';

describe('nsfw loader', () => {
  beforeEach(() => {
    __resetForTests();
    // Setup window mock
    global.window = {
      document: {
        head: {
          appendChild: vi.fn(),
        },
        querySelector: vi.fn(() => null),
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    __resetForTests();
    vi.clearAllMocks();
  });

  it('throws error when called outside browser', async () => {
    const originalWindow = global.window;
    // @ts-expect-error - intentionally removing window for test
    delete global.window;

    await expect(loadNSFWModel()).rejects.toThrow('loadNSFWModel must run in the browser');

    global.window = originalWindow;
  });

  it('returns a singleton model (no double-load)', async () => {
    const fakeModel = {
      classify: vi.fn(async () => [
        { className: 'Neutral', probability: 0.9 },
      ]),
    };

    const loadFn = vi.fn(async () => fakeModel);

    // Mock window.nsfwjs
    Object.defineProperty(global.window, 'tf', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.window, 'nsfwjs', {
      value: { load: loadFn },
      writable: true,
      configurable: true,
    });

    const a = await loadNSFWModel('/x/', { size: 299, type: 'graph' });
    const b = await loadNSFWModel('/x/', { size: 299, type: 'graph' });

    expect(a).toBe(b);
    expect(loadFn).toHaveBeenCalledTimes(1);
  });

  it('skips loading scripts if already present', async () => {
    const fakeModel = {
      classify: vi.fn(async () => []),
    };

    Object.defineProperty(global.window, 'tf', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.window, 'nsfwjs', {
      value: {
        load: vi.fn(async () => fakeModel),
      },
      writable: true,
      configurable: true,
    });

    const appendChildSpy = vi.fn();
    Object.defineProperty(global.window, 'document', {
      value: {
        head: { appendChild: appendChildSpy },
        querySelector: vi.fn(() => null),
      },
      writable: true,
      configurable: true,
    });

    await loadNSFWModel();

    expect(appendChildSpy).not.toHaveBeenCalled();
  });

  it('throws error if model classify method is missing', async () => {
    Object.defineProperty(global.window, 'tf', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.window, 'nsfwjs', {
      value: {
        load: vi.fn(async () => ({})), // Model without classify
      },
      writable: true,
      configurable: true,
    });

    await expect(loadNSFWModel()).rejects.toThrow('classify method is missing');
  });

  it('classify wrapper calls model.classify', async () => {
    const classifyFn = vi.fn(async () => [
      { className: 'Neutral', probability: 0.9 },
    ]);

    const fakeModel = { classify: classifyFn };

    Object.defineProperty(global.window, 'tf', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.window, 'nsfwjs', {
      value: {
        load: vi.fn(async () => fakeModel),
      },
      writable: true,
      configurable: true,
    });

    const img = document.createElement('img');
    const result = await classify(img, 3);

    expect(classifyFn).toHaveBeenCalledWith(img, 3);
    expect(result).toEqual([{ className: 'Neutral', probability: 0.9 }]);
  });
});

