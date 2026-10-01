import { act, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import PageLoadError from '../src/components/common/PageLoadError';

it('offers recovery instead of the raw router exception when a page module cannot load', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const BrokenPage = lazy(() => Promise.reject(new TypeError('Importing a module script failed.')));
  const router = createMemoryRouter([{
    path: '/',
    element: <Suspense fallback="Loading"><BrokenPage /></Suspense>,
    errorElement: <PageLoadError />,
  }]);
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => { root.render(<RouterProvider router={router} />); });
    expect(container.textContent).toContain('暫時無法開啟頁面');
    expect(container.textContent).toContain('重新開啟');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/store');
    expect(container.textContent).not.toContain('Unexpected Application Error');
    expect(container.textContent).not.toContain('Importing a module script failed');
  } finally {
    await act(async () => { root.unmount(); });
    router.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
