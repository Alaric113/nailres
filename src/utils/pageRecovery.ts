import { isPublicStoreTarget, requiresLiffBootstrap, resolveLiffTarget } from './liffRoute';

export function getPageRecoveryUrl(href: string, liffId?: string): string {
  const url = new URL(href);
  if (/^\/liff(?:\/|$)/.test(url.pathname) || (url.pathname === '/' && requiresLiffBootstrap(url.search, url.hash))) {
    const target = resolveLiffTarget(url.pathname, url.search);
    if (isPublicStoreTarget(target)) return new URL(target, url.origin).toString();
    if (liffId) return `https://liff.line.me/${liffId}?${new URLSearchParams({ redirect: target })}`;
    return new URL(`/liff?${new URLSearchParams({ redirect: target })}`, url.origin).toString();
  }
  // General web-login callbacks also contain single-use authorization codes.
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  return url.toString();
}

export async function reopenCurrentPage(): Promise<void> {
  const destination = getPageRecoveryUrl(window.location.href, import.meta.env.VITE_LIFF_ID);
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.waiting) {
      // Activate an already downloaded update only after the user requests recovery.
      await new Promise<void>(resolve => {
        const finish = () => {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener('controllerchange', finish);
          resolve();
        };
        const timer = setTimeout(finish, 1500);
        navigator.serviceWorker.addEventListener('controllerchange', finish);
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  } catch {
    // Storage/worker access may be unavailable in an embedded browser.
  }
  window.location.replace(destination);
}
