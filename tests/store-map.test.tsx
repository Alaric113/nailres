import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreMap from '../src/components/StoreMap';

const mocks = vi.hoisted(() => ({ loadStoreMap: vi.fn(), createStoreMap: vi.fn(), dispose: vi.fn() }));
vi.mock('../src/lib/loadStoreMap', () => ({ loadStoreMap: mocks.loadStoreMap }));

let root: Root;
let container: HTMLDivElement;

async function mount() {
  await act(async () => {
    root.render(<StrictMode><StoreMap position={[25.081264, 121.47417]} /></StrictMode>);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.createStoreMap.mockReset().mockReturnValue(mocks.dispose);
  mocks.loadStoreMap.mockReset().mockResolvedValue({ createStoreMap: mocks.createStoreMap });
  mocks.dispose.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('public store map', () => {
  it('loads one renderer in StrictMode, with the correct longitude/latitude', async () => {
    await mount();
    expect(mocks.createStoreMap).toHaveBeenCalledTimes(1);
    expect(mocks.createStoreMap.mock.calls[0][1]).toEqual([121.47417, 25.081264]);
    expect(container.textContent).toContain('地圖載入中');
    await act(async () => { mocks.createStoreMap.mock.calls[0][2](); });
    expect(container.textContent).not.toContain('地圖載入中');
    await act(async () => { vi.advanceTimersByTime(20_000); });
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('uses a key-free fallback if WebGL initialization throws', async () => {
    mocks.createStoreMap.mockImplementation(() => { throw new Error('WebGL unavailable'); });
    await mount();
    const iframe = container.querySelector('iframe');
    expect(iframe?.src).toContain('https://www.openstreetmap.org/export/embed.html?');
    expect(new URL(iframe!.src).searchParams.get('marker')).toBe('25.081264,121.47417');
    expect(container.textContent).toContain('備援地圖');
  });

  it('does not throw a route error if the map module fails to download', async () => {
    mocks.loadStoreMap.mockRejectedValue(new Error('Importing a module script failed'));
    await mount();
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(mocks.createStoreMap).not.toHaveBeenCalled();
  });

  it('falls back after a stalled tile load and disposes the renderer', async () => {
    await mount();
    await act(async () => { vi.advanceTimersByTime(15_000); });
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    await act(async () => { mocks.createStoreMap.mock.calls[0][2](); });
    expect(container.textContent).toContain('備援地圖');
  });

  it('falls back on graphics context loss even after a successful load', async () => {
    await mount();
    await act(async () => { mocks.createStoreMap.mock.calls[0][2](); });
    await act(async () => { mocks.createStoreMap.mock.calls[0][3](); });
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it('releases the renderer and timer when leaving the page', async () => {
    await mount();
    await act(async () => { root.unmount(); });
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    root = createRoot(container);
  });

  it('does not initialize a late module after leaving the page', async () => {
    let finish!: (value: { createStoreMap: typeof mocks.createStoreMap }) => void;
    mocks.loadStoreMap.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    await mount();
    await act(async () => { root.unmount(); });
    await act(async () => { finish({ createStoreMap: mocks.createStoreMap }); });
    expect(mocks.createStoreMap).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    root = createRoot(container);
  });
});
