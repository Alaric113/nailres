import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ init: vi.fn(), isLoggedIn: vi.fn() }));
vi.mock('@line/liff', () => ({ default: sdk }));

beforeEach(() => {
  vi.resetModules();
  sdk.init.mockReset();
  window.history.replaceState({}, '', '/liff');
});

describe('shared LIFF initialization', () => {
  it('initializes the SDK only once for concurrent layout/page callers and later calls', async () => {
    let resolve!: () => void;
    sdk.init.mockReturnValue(new Promise<void>(done => { resolve = done; }));
    const { initializeLiff } = await import('../src/lib/liff');

    const layout = initializeLiff();
    const page = initializeLiff();
    expect(sdk.init).toHaveBeenCalledTimes(1);
    resolve();
    expect(await layout).toBe(sdk);
    expect(await page).toBe(sdk);
    expect(await initializeLiff()).toBe(sdk);
    expect(sdk.init).toHaveBeenCalledTimes(1);
  });

  it('allows a retry after initialization fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sdk.init.mockRejectedValueOnce(new Error('network error')).mockResolvedValue(undefined);
    const { initializeLiff } = await import('../src/lib/liff');

    expect(await initializeLiff()).toBeNull();
    expect(await initializeLiff()).toBe(sdk);
    expect(sdk.init).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});
