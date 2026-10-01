// @vitest-environment node
import type { HandlerEvent } from '@netlify/functions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  getUser: vi.fn(),
  setUser: vi.fn(),
  createCustomToken: vi.fn(),
  getCoupons: vi.fn(),
}));
vi.mock('axios', () => ({ default: { post: mocks.verify } }));
vi.mock('firebase-admin', () => ({
  default: {
    apps: [{}],
    auth: () => ({ createCustomToken: mocks.createCustomToken }),
    firestore: { FieldValue: { serverTimestamp: () => 'server-timestamp' } },
  },
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => name === 'users'
      ? { doc: () => ({ get: mocks.getUser, set: mocks.setUser }) }
      : { where: () => ({ where: () => ({ get: mocks.getCoupons }) }) },
  }),
}));

async function login(body: Record<string, unknown>) {
  const { handler } = await import('../netlify/functions/line-liff-auth');
  return handler({ httpMethod: 'POST', body: JSON.stringify(body) } as HandlerEvent, {} as never, () => {});
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_LINE_CHANNEL_ID', 'test-channel');
  mocks.verify.mockResolvedValue({ data: { sub: 'verified-user', name: 'Verified Name', picture: 'verified-avatar' } });
  mocks.getUser.mockResolvedValue({ exists: true, data: () => ({ profile: { displayName: 'Old Name', avatarUrl: 'old-avatar' }, role: 'admin' }) });
  mocks.setUser.mockResolvedValue(undefined);
  mocks.createCustomToken.mockResolvedValue('firebase-custom-token');
  mocks.getCoupons.mockResolvedValue({ size: 0, empty: true });
});

describe('server-owned LINE profile', () => {
  it('uses verified ID token claims rather than client-supplied profile data', async () => {
    const result = await login({ idToken: 'line-id-token', displayName: 'Unverified Name', pictureUrl: 'unverified-avatar' });

    expect(result?.statusCode).toBe(200);
    expect(mocks.setUser).toHaveBeenCalledWith({
      profile: { displayName: 'Verified Name', avatarUrl: 'verified-avatar' },
      updatedAt: 'server-timestamp',
    }, { merge: true });
    expect(mocks.createCustomToken).toHaveBeenCalledWith('verified-user');
  });

  it('preserves an existing profile when optional ID token claims are missing', async () => {
    mocks.verify.mockResolvedValue({ data: { sub: 'verified-user' } });
    await login({ idToken: 'line-id-token' });

    expect(mocks.setUser.mock.calls[0][0].profile).toEqual({ displayName: 'Old Name', avatarUrl: 'old-avatar' });
  });

  it('creates a new profile without undefined fields when optional claims are missing', async () => {
    mocks.verify.mockResolvedValue({ data: { sub: 'verified-user' } });
    mocks.getUser.mockResolvedValue({ exists: false });
    const result = await login({ idToken: 'line-id-token' });

    expect(result?.statusCode).toBe(200);
    expect(mocks.setUser.mock.calls[0][0].profile).toEqual({ displayName: 'LINE 使用者', avatarUrl: '' });
    expect(mocks.setUser.mock.calls[0][0].role).toBe('user');
  });

  it('still blocks deleted accounts', async () => {
    mocks.getUser.mockResolvedValue({ exists: true, data: () => ({ deleted: true }) });
    const result = await login({ idToken: 'line-id-token' });

    expect(result?.statusCode).toBe(403);
    expect(mocks.setUser).not.toHaveBeenCalled();
  });
});
