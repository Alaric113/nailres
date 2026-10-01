import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LiffEntry from '../src/pages/liff/LiffEntry';
import { useAuthStore } from '../src/store/authStore';

const mocks = vi.hoisted(() => ({
  location: { pathname: '/liff', search: '' },
  navigate: vi.fn(),
  initializeLiff: vi.fn(),
  getProfile: vi.fn(),
  signInWithCustomToken: vi.fn(),
  signInAnonymously: vi.fn(),
  login: vi.fn(),
  auth: { currentUser: null as null | { uid: string }, authStateReady: vi.fn() },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.location,
}));
vi.mock('../src/lib/liff', () => ({ initializeLiff: mocks.initializeLiff }));
vi.mock('../src/lib/firebase', () => ({ auth: mocks.auth }));
vi.mock('../src/pages/StoreInfoPage', () => ({ default: () => <div>Public store information</div> }));
vi.mock('firebase/auth', () => ({
  signInWithCustomToken: mocks.signInWithCustomToken,
  signInAnonymously: mocks.signInAnonymously,
  signOut: vi.fn(),
}));
vi.mock('framer-motion', async () => {
  const { createElement } = await import('react');
  return {
    motion: {
      div: ({ children, className }: { children: React.ReactNode; className?: string }) =>
        createElement('div', { className }, children),
    },
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

const liff = {
  isLoggedIn: () => true,
  isInClient: () => true,
  login: mocks.login,
  getIDToken: () => 'verified-by-server-id-token',
  getProfile: mocks.getProfile,
};

let root: Root;
let container: HTMLDivElement;
let fetchMock: ReturnType<typeof vi.fn>;

async function mount() {
  await act(async () => { root.render(<StrictMode><LiffEntry /></StrictMode>); });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.location.search = '';
  mocks.location.pathname = '/liff';
  window.history.replaceState({}, '', '/liff');
  mocks.auth.currentUser = null;
  mocks.auth.authStateReady.mockResolvedValue(undefined);
  mocks.initializeLiff.mockResolvedValue(liff);
  mocks.getProfile.mockResolvedValue({ displayName: 'LINE User', userId: 'line-user' });
  mocks.signInWithCustomToken.mockResolvedValue({ user: { uid: 'line-user' } });
  useAuthStore.setState({ currentUser: null, userProfile: null, authIsLoading: false });
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ firebaseCustomToken: 'server-custom-token' }),
  });
  vi.stubGlobal('fetch', fetchMock);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('LIFF loading/login spinner', () => {
  it('lets the SDK handle its OAuth callback instead of exchanging the code a second time', async () => {
    mocks.location.search = '?code=sdk-consumed-code&state=sdk-state&redirect=%2Fmember';
    await mount();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/line-liff-auth');
  });

  it('does not launch a second LINE Login flow inside a LIFF client with expired authorization', async () => {
    mocks.initializeLiff.mockResolvedValue({ ...liff, isLoggedIn: () => false });
    await mount();

    expect(container.textContent).toContain('從圖文選單重新開啟');
    expect(mocks.login).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses SDK-managed login with a clean return URL in an external browser', async () => {
    mocks.location.search = '?redirect=%2Fmember';
    mocks.initializeLiff.mockResolvedValue({ ...liff, isLoggedIn: () => false, isInClient: () => false });
    await mount();

    expect(mocks.login).toHaveBeenCalledWith({ redirectUri: `${window.location.origin}/liff?redirect=%2Fmember` });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    '/liff?redirect=%2Fstore',
    '/liff?liff.state=' + encodeURIComponent('?redirect=%2Fstore'),
    '/liff/store',
  ])('shows store information without waiting for authentication at %s', async path => {
    const url = new URL(path, window.location.origin);
    mocks.location.pathname = url.pathname;
    mocks.location.search = url.search;
    mocks.initializeLiff.mockReturnValue(deferred<typeof liff>().promise);
    mocks.auth.authStateReady.mockReturnValue(deferred<void>().promise);
    await mount();
    // Let the public page's lazy import settle without advancing network promises.
    await act(async () => { await vi.dynamicImportSettled(); });

    expect(container.textContent).toContain('Public store information');
    expect(mocks.auth.authStateReady).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('does not rewrite a primary LIFF redirect before SDK initialization finishes', async () => {
    mocks.location.search = '?liff.state=' + encodeURIComponent('?redirect=%2Fmember');
    const sdk = deferred<typeof liff>();
    mocks.initializeLiff.mockReturnValue(sdk.promise);
    useAuthStore.setState({ currentUser: { uid: 'existing-user' } as never });
    await mount();

    expect(mocks.initializeLiff).toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    await act(async () => { sdk.resolve(liff); });
    expect(mocks.navigate).toHaveBeenCalledWith('/member', { replace: true });
  });

  it('skips authentication work for a session already available in the store', async () => {
    useAuthStore.setState({ currentUser: { uid: 'existing-user' } as never });
    await mount();

    expect(mocks.initializeLiff).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });

  it('starts server authentication without waiting for the optional LINE profile request', async () => {
    mocks.getProfile.mockReturnValue(deferred<object>().promise);
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(fetchMock, 'still waiting on an optional profile after five seconds').toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/line-liff-auth');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ idToken: 'verified-by-server-id-token' });
    expect(mocks.signInWithCustomToken).toHaveBeenCalledWith(mocks.auth, 'server-custom-token');
  });

  it('does not exchange a LINE token when a persisted Firebase session is restored during LIFF initialization', async () => {
    const ready = deferred<void>();
    const sdk = deferred<typeof liff>();
    mocks.auth.authStateReady.mockReturnValue(ready.promise);
    mocks.initializeLiff.mockReturnValue(sdk.promise);
    await mount();

    await act(async () => {
      mocks.auth.currentUser = { uid: 'persisted-user' };
      ready.resolve();
      sdk.resolve(liff);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/booking', { replace: true });
  });

  it('redirects a restored store session immediately even while the SDK is still loading', async () => {
    mocks.initializeLiff.mockReturnValue(deferred<typeof liff>().promise);
    await mount();
    await act(async () => {
      useAuthStore.setState({ currentUser: { uid: 'restored-user' } as never });
    });

    expect(mocks.navigate).toHaveBeenCalledWith('/booking', { replace: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not wait for a stalled SDK when Firebase restores a session before its profile loads', async () => {
    const ready = deferred<void>();
    mocks.auth.authStateReady.mockReturnValue(ready.promise);
    mocks.initializeLiff.mockReturnValue(deferred<typeof liff>().promise);
    useAuthStore.setState({ authIsLoading: true });
    await mount();
    await act(async () => {
      mocks.auth.currentUser = { uid: 'persisted-user' };
      ready.resolve();
    });

    expect(mocks.navigate).toHaveBeenCalledWith('/booking', { replace: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('waits for Firebase to confirm that there is no session before exchanging a token', async () => {
    const ready = deferred<void>();
    mocks.auth.authStateReady.mockReturnValue(ready.promise);
    await mount();
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => { ready.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserves a target carried by liff.state after successful authentication', async () => {
    mocks.location.search = '?liff.state=' + encodeURIComponent('/my-bookings?tab=upcoming');
    await mount();
    await act(async () => {
      useAuthStore.setState({ currentUser: { uid: 'line-user' } as never });
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.navigate).toHaveBeenCalledWith('/my-bookings?tab=upcoming', { replace: true });
  });

  it('does not double-decode percent escapes inside the return URL', async () => {
    const target = '/my-bookings?return=%2Fbooking%3Fdesigner%3Da';
    mocks.location.search = '?liff.state=' + encodeURIComponent(target);
    await mount();
    await act(async () => {
      useAuthStore.setState({ currentUser: { uid: 'line-user' } as never });
    });
    expect(mocks.navigate).toHaveBeenCalledWith(target, { replace: true });
  });

  it('falls back safely when liff.state is malformed', async () => {
    mocks.location.search = '?liff.state=%25';
    await mount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      useAuthStore.setState({ currentUser: { uid: 'line-user' } as never });
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/booking', { replace: true });
  });

  it('does not sign in when the server rejects verification', async () => {
    fetchMock.mockResolvedValue({ ok: false, text: async () => 'account disabled' });
    await mount();

    expect(container.textContent).toContain('LINE 授權連線中斷');
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('aborts a pending request when the page unmounts and ignores a late response', async () => {
    const response = deferred<object>();
    fetchMock.mockReturnValue(response.promise);
    await mount();
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    await act(async () => { root.render(<div>Another page</div>); });

    expect(signal.aborted).toBe(true);
    await act(async () => {
      response.resolve({ ok: true, json: async () => ({ firebaseCustomToken: 'late-token' }) });
    });
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
  });

  it('stops a pending request at the watchdog deadline instead of accepting a late login', async () => {
    const response = deferred<object>();
    fetchMock.mockReturnValue(response.promise);
    await mount();
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });

    expect(signal.aborted).toBe(true);
    expect(container.textContent).toContain('系統回應逾時');
    await act(async () => {
      response.resolve({ ok: true, json: async () => ({ firebaseCustomToken: 'late-token' }) });
      useAuthStore.setState({ currentUser: { uid: 'late-user' } as never });
    });
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('does not start authentication if SDK initialization finishes after a timeout', async () => {
    const sdk = deferred<typeof liff>();
    mocks.initializeLiff.mockReturnValue(sdk.promise);
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    await act(async () => { sdk.resolve(liff); });

    expect(container.textContent).toContain('系統回應逾時');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
