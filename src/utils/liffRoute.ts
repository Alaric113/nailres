export function resolveLiffTarget(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  let target = params.get('redirect');
  if (!target) {
    let state = params.get('liff.state');
    if (state) {
      if (state.startsWith('%')) {
        try { state = decodeURIComponent(state); } catch { state = ''; }
      }
      if (state.startsWith('?') || state.startsWith('/?')) {
        target = new URLSearchParams(state.slice(state.indexOf('?'))).get('redirect');
      } else if (state) {
        target = state.startsWith('/') ? state : `/${state}`;
      }
    }
  }
  if (!target && pathname.startsWith('/liff/')) target = pathname.slice('/liff'.length) + search;
  // Only navigate within the application, and never loop back into the entry page.
  if (!target?.startsWith('/') || /^\/[/\\]/.test(target) || /[\\\s]/.test(target) || /^\/liff(?:[/?#]|$)/.test(target)) {
    return '/booking';
  }
  return target;
}

export function isPublicStoreTarget(target: string): boolean {
  return target.split(/[?#]/)[0].replace(/\/+$/, '') === '/store';
}

export function requiresLiffBootstrap(search: string, hash: string): boolean {
  const params = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  return Array.from(params.keys()).some(key => key.startsWith('liff.'))
    || params.has('code')
    || ['access_token', 'id_token', 'context_token'].some(key => fragment.has(key));
}
