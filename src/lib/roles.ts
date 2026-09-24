/**
 * The one place that decides what a role string means.
 *
 * Before this module the vocabulary was defined four times and disagreed each time:
 *
 *   - `src/types/auth.d.ts` declared `UserRole = "ADMIN" | "CUSTOMER"`, and
 *     `src/hooks/use-auth.ts` collapsed everything that was not literally `"ADMIN"` to
 *     `"CUSTOMER"`.
 *   - `src/features/admin/users/store/admin-users-store.ts` treated `SUPER_ADMIN` and
 *     `STORE_MANAGER` as administrators, and wrote both into `profiles.role`.
 *   - The database agreed with the store, not the hook: `profiles`' CHECK constraint
 *     admits `SUPER_ADMIN`, and `public.is_admin()` returns true for it.
 *   - `api/cancel-order.ts` accepted `SUPER_ADMIN` but not `STORE_MANAGER`.
 *
 * The observable failure: a staff member created through the staff-management screen with
 * any role other than the literal string `ADMIN` held full privileges at the database
 * level and was shown the 403 "Access Denied" screen by `admin-layout.tsx`, because that
 * gate reads the hook's collapsed value. `STORE_MANAGER` was refused order cancellation
 * by the serverless handler for the same reason.
 *
 * Deliberately free of imports and of Node, Deno and DOM APIs, so the browser hook, the
 * serverless handlers and the test runner can all share it — the same constraint
 * `src/lib/cancellation-authorization.ts` documents for itself.
 */

/**
 * Every role string the system recognises.
 *
 * `USER` and the lower-case spellings that `supabase/fix_registration_trigger_and_role_check.sql`
 * still admits in its CHECK constraint are not listed: they normalise to `CUSTOMER`
 * through the case-folding in `normalizeUserRole` and the fallback below, which is what
 * they mean.
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STORE_MANAGER" | "STAFF" | "CUSTOMER";

const KNOWN_ROLES: readonly UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "STORE_MANAGER",
  "STAFF",
  "CUSTOMER",
];

/**
 * Roles that carry administrative authority.
 *
 * This list matches `public.is_admin()` and the `normalizeRole` helper in
 * admin-users-store, which is the point: a role that the database will let write must not
 * be one the UI refuses to admit, and vice versa.
 *
 * `STAFF` is deliberately absent. It is a real role — the staff-management screen assigns
 * it, with view-only permissions — but no console access has ever been granted to it, and
 * widening the admin gate is not something this normalisation should do silently. Staff
 * access, if wanted, is a product decision that needs its own scoped UI.
 */
const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"];

/**
 * Case-folds an arbitrary role string to the vocabulary above, defaulting to the least
 * privileged value. Unknown strings become `CUSTOMER` rather than throwing: role data
 * arrives from three tables and a JWT claim, and an unrecognised value is a reason to
 * grant nothing, not a reason to break the page.
 */
export function normalizeUserRole(roleString?: string | null): UserRole {
  const upper = (roleString || "").trim().toUpperCase();
  return (KNOWN_ROLES as readonly string[]).includes(upper) ? (upper as UserRole) : "CUSTOMER";
}

/** True when the role may use the admin console and the admin-only server paths. */
export function isAdminRole(roleString?: string | null): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(normalizeUserRole(roleString));
}
