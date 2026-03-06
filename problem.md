# Problem List (Account Register / Edit / Delete)

## 1) Deleted accounts can be reactivated by LINE login
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
