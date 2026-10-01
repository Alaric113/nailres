import { describe, expect, it } from 'vitest';
import { getPageRecoveryUrl } from '../src/utils/pageRecovery';

describe('reopening a page after a failed module download', () => {
  it('restarts a LIFF entry without replaying a consumed authorization code', () => {
    expect(getPageRecoveryUrl('https://example.com/liff?code=used&state=old&redirect=%2Fmember#access_token=expired', 'test-liff'))
      .toBe('https://liff.line.me/test-liff?redirect=%2Fmember');
  });

  it('opens the public store directly even if LINE initialization failed', () => {
    expect(getPageRecoveryUrl('https://example.com/liff?liff.state=%3Fredirect%3D%252Fstore#access_token=expired', 'test-liff'))
      .toBe('https://example.com/store');
  });

  it('keeps the standard website login separate from the LIFF login flow', () => {
    expect(getPageRecoveryUrl('https://example.com/login?code=used&state=old', 'test-liff'))
      .toBe('https://example.com/login');
  });

  it('preserves ordinary booking query parameters', () => {
    expect(getPageRecoveryUrl('https://example.com/booking?category=nails', 'test-liff'))
      .toBe('https://example.com/booking?category=nails');
  });

  it('does not retain credentials when the LIFF ID is unavailable', () => {
    expect(getPageRecoveryUrl('https://example.com/liff?code=used&state=old&redirect=%2Fmember'))
      .toBe('https://example.com/liff?redirect=%2Fmember');
  });
});
