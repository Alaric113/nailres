# Problem List (Account Register / Edit / Delete)

## 1) Deleted accounts can be reactivated by LINE login
- Follow-up status (2026-10-01): both LINE authentication functions now reject
  deleted profiles. The reactivation behavior below is historical; enforcement
  across other login entry points still needs review.
- Problem:
  - A deleted account can log in again via LINE and get reactivated automatically.
- Source:
  - `netlify/functions/delete-user.ts`: marks user as `deleted: true`, `role: 'deleted'`, and attempts Auth deletion.
  - `netlify/functions/line-liff-auth.ts` and `netlify/functions/line-oauth-auth.ts`: if `userData.deleted` is true, they set `deleted: false` and `role: 'user'`.
- Fix:
  - In LINE auth functions, block login when `deleted === true` (return 403 and do not issue Firebase custom token).
  - Add an explicit `isBanned`/`accountStatus` policy and enforce it in all login entry points.
  - Keep deletion policy consistent: soft-delete only or hard-delete only, but not conflicting behavior.

## 2) User edit permission is too broad (manager can modify sensitive user fields)
- Problem:
  - Managers can update any user fields (including `role`) via current Firestore rules.
- Source:
  - `firestore.rules.txt`:
    - `canAdminAllDesigners()` includes manager.
    - `match /users/{userId}` `allow update ... || canAdminAllDesigners();`
- Fix:
  - Split privileges:
    - Only `admin` can change `role`, `deleted`, and other high-risk fields.
    - `manager` only allowed to edit limited profile/business fields.
  - Use `affectedKeys().hasOnly([...])` allowlists for each role.

## 3) Role editing relies on frontend direct writes, without backend centralized authorization/audit
- Problem:
  - Admin pages directly call `updateDoc(users/{id}, { role })`; no server-side command boundary.
- Source:
  - `src/pages/CustomerListPage.tsx`
  - `src/pages/CustomerDetailPage.tsx`
- Fix:
  - Move role changes to a secured backend function (e.g. `/api/update-user-role`).
  - Validate caller identity + role on server.
  - Add audit log (who changed which user role and when).
  - Keep Firestore rules strict so direct client writes to role are denied.

## 4) Delete-user flow misses critical safety guards
- Problem:
  - No guard against deleting self.
  - No guard against deleting the last remaining admin.
- Source:
  - `netlify/functions/delete-user.ts` only checks requester role is admin.
- Fix:
  - Add checks:
    - Reject if `targetUserId === requesterUid`.
    - Reject if target is last admin.
  - Add transaction-style validation before apply.
  - Return explicit error codes/messages for operational safety.

## 5) Registration logic is duplicated and can become inconsistent
- Problem:
  - Registration/profile bootstrap/new-user coupon logic exists in multiple places, causing race/inconsistency risk.
- Source:
  - `src/pages/Register.tsx`: creates user doc + distributes new user coupon.
  - `src/hooks/useAuth.ts`: when missing user doc, also creates user doc + coupon.
- Fix:
  - Single source of truth for onboarding:
    - Prefer backend-triggered user bootstrap (Auth trigger or dedicated API).
    - Frontend should only handle auth UI, not duplicate profile/coupon creation logic.
  - Ensure idempotency (no duplicate coupon issuance for same onboarding event).

## Suggested Priority
1. P0: Block deleted-account reactivation.
2. P0: Tighten `users` update rules for role/sensitive fields.
3. P1: Add delete-user safety guards.
4. P1: Move role update to backend + audit log.
5. P1: Consolidate registration/onboarding flow.

## LIFF Follow-Up (2026-10-01)

### 6) Public store information unnecessarily waits for login
- Problem: the rich-menu URL `https://liff.line.me/2008325180-Zlzp27vq?redirect=%2Fstore`
  enters authentication even though `/store` is public.
- Source: `src/pages/liff/LiffEntry.tsx` ran login for every destination;
  `src/layouts/UserLayout.tsx` also initialized LINE on direct store visits.
- Fix: render the public store immediately for direct, nested, and `liff.state`
  destinations. Background LIFF initialization does not require Firebase login.
  Direct `/store` visits do not initialize the LIFF SDK.
- Verification: tests leave LIFF and Firebase promises unresolved and still assert
  public content renders without authentication API calls. Also checked in browser.
- Menu option: `https://treering83.netlify.app/store` avoids LINE launch/consent
  entirely. The actual LINE rich menu has not been changed.

### 7) Early navigation and mixed OAuth flows can break reopening LIFF
- Problem: existing-session navigation could remove LINE parameters before
  `liff.init()` completed. SDK callbacks were sent to a second OAuth exchange API,
  potentially reusing a single-use code. Expired in-client sessions launched a
  manually constructed LINE Login flow.
- Source: `src/pages/liff/LiffEntry.tsx`, `src/components/auth/RootRedirect.tsx`.
- Fix: finish the SDK handshake before navigation; let the SDK own code/state;
  send its ID token to the server. Use `liff.login()` only in external browsers.
  Expired in-client authorization offers a clean reopen without old credentials.
  `src/App.tsx` accepts `/liff/*` secondary paths; `src/utils/liffRoute.ts` resolves
  destinations consistently.
- Verification: tests cover a restored session with a pending SDK, SDK-consumed
  callback codes, expired in-client authorization, and external login.
- Limit: the phone displayed only "Bad Request". Its exact live 400 cause has not
  been proven. These are confirmed code defects, not proof that every 400 is fixed.
- Reference: https://developers.line.biz/en/tips/2026/07/16/liff-url-additional-info/

### 8) Reopening after deployment can fail to import a page module
- Symptom: "Unexpected Application Error" / "Importing a module script failed".
- Source: lazy routes in `src/App.tsx`, automatic worker activation in
  `vite.config.ts`, missing HTML revalidation and asset-404 rules in `netlify.toml`,
  and no application-level route error screen.
- Cause to verify live: an old document/worker can reference removed chunks. Missing
  chunks previously fell through to the SPA HTML rewrite. Network failures can
  cause the same message.
- Fix: explicit PWA update activation; HTML/worker revalidation; real 404s for
  missing assets; a recovery screen that can activate a waiting worker and reopen
  a clean URL. Store recovery opens `/store`. No automatic reload loop is used.
- Deployment check: inspect HTML/worker headers and test a tab left open across
  deployment. Local tests cannot establish live Netlify cache behavior.
- Reference: https://vite.dev/guide/build#load-error-handling

### 9) Blank startup and unnecessary login work increase waiting
- Source: empty `#root`, blocking external CSS, eager home/admin imports, serial
  `getProfile()` before login, repeated SDK initialization, and session-restore races.
- Fix: show startup content before JavaScript loads, defer external styles, lazy-load
  home/admin layouts, remove the extra profile request, share SDK initialization,
  reuse sessions after the required handshake, preserve destinations, and abort
  obsolete requests on unmount/timeout.
- Verification: slow-network tests reproduced a five-second wait before any auth
  request; the tests pass after removing the unnecessary request.
- Remaining: real phone latency has not been measured. The main production JS
  chunk is still about 1.1 MB uncompressed and warrants further splitting.

### 10) Store map shows an API-key error
- Source: the previous CARTO tile URL in `src/pages/StoreInfoPage.tsx` displayed "API Key
  Required" during browser verification.
- Cause: CARTO requires a Basemaps API key (policy effective 2026-09-23).
  Restoring Voyager without a configured key did not remove the watermark.
- Fix: following the user's request for a similar key-free style, replace CARTO
  with OpenFreeMap Liberty and MapLibre. Retain pale roads, parks, the store pin,
  zoom controls and navigation; use flat buildings and local Chinese names.
  The provider allows commercial use with no registration or API key.
- Loading: `src/components/StoreMap.tsx` loads the renderer separately from store
  content. Failed module downloads, unavailable WebGL, graphics context loss,
  or an initial load stalled for 15 seconds switch to an OpenStreetMap embed.
  The fallback also needs no key, and store details/navigation remain usable.
- Attribution: keep OpenMapTiles/OpenStreetMap credits at the top so the bottom
  information sheet cannot obscure them. Remove unused Leaflet dependencies and
  their global stylesheet. No `VITE_CARTO_BASEMAP_API_KEY` is required anymore.
- Tradeoff: Liberty is similar, not identical, to Voyager. OpenFreeMap offers no
  SLA; real LINE webviews still need device verification after deployment.
- References: https://openfreemap.org/ and https://openfreemap.org/quick_start/
  (original provider change: https://carto.com/basemaps/apikey/).

### 11) Local production build aborts under the current Node 24 runtime
- Observation: TypeScript/tests pass, but Vite aborts after transformation under
  this machine's Node 24.13.0 without a JavaScript diagnostic.
- Workaround: pin Node 22 in `.nvmrc` and Netlify `NODE_VERSION`. The same build
  succeeds on Node 22, including service-worker generation.
- Limit: the underlying native Node 24/toolchain crash has not been isolated.

These are local fixes until deployed. Phone reopening, LINE configuration, and
production response headers still require deployment checks.

Validation after the key-free map replacement: 39 regression tests, TypeScript
build checking, targeted ESLint, and the production Vite/PWA build using Node 22
passed. Browser inspection confirmed the public store route, Chinese map labels,
store marker/popup and visible provider credits at desktop and mobile widths.
