/**
 * Order cancellation authorization.
 *
 * Lives in `src/lib/` rather than beside the handler so the decision logic is independent
 * of where the endpoint is hosted. It moved here during the Vercel-to-Supabase migration:
 * `tests/order-cancellation-security.test.ts` imported it straight out of
 * `api/cancel-order.ts`, which meant relocating that handler would have broken the suite
 * guarding these exact rules. The rules and the transport now version separately.
 *
 * Deliberately free of Node, Deno and DOM APIs, so the same module serves the Vercel
 * handler, the Supabase Edge Function and the test runner without a shim. The single
 * import below is `src/lib/roles.ts`, which is bound by the same constraint — the role
 * vocabulary must be shared with the database-facing code, or the two drift apart again.
 */

import { isAdminRole } from "./roles.ts";

/**
 * Pure authorization evaluator for order cancellation.
 * Ensures caller identity is verified strictly against app_metadata or database roles,
 * completely rejecting client-controlled user_metadata.
 *
 * Ownership is decided by `orders.user_id` alone. A previous revision also accepted an
 * `order.user_email` match:
 *
 *   (order.user_id && order.user_id === caller.id) ||
 *   (order.user_email && caller.email && order.user_email.toLowerCase() === caller.email.toLowerCase())
 *
 * Measured against that code: an order with `user_id = "customer-A"` and
 * `user_email = "b@example.com"` returned `{allowed: true}` for caller B. The order had a
 * known owner and the caller was not it. `user_email` is data typed at checkout — a gift
 * recipient, a typo, a shared household address — so it cannot widen ownership.
 *
 * Orders with no `user_id` are refused rather than matched on email. Nothing is lost:
 * this endpoint requires a Bearer session, so an actual guest can never reach it, and no
 * customer-facing cancellation UI exists (the only caller in the codebase is
 * src/features/admin/orders/store/admin-orders-store.ts). Administrators can still cancel
 * those orders, which is the only path the product actually has. Accepting the email
 * instead would mean anyone able to register as victim@example.com inherits that victim's
 * unowned orders — and whether registration requires confirming the address is a Supabase
 * project setting, not something this code can see. Proving control of an address needs a
 * per-order signed link sent to it, not a string comparison.
 */
export function evaluateCancellationPermissions(
  caller: { id: string; email?: string; app_metadata?: Record<string, unknown> },
  order: { user_id?: string | null; user_email?: string | null; status: string },
  dbRole?: string,
): { allowed: boolean; status: number; error?: string } {
  const currentStatus = (order.status || "").toUpperCase();

  // 1. State machine validation
  if (currentStatus === "CANCELLED") {
    return { allowed: false, status: 409, error: "Conflict: Order is already cancelled." };
  }
  if (currentStatus === "DELIVERED") {
    return {
      allowed: false,
      status: 409,
      error: "Conflict: Cannot cancel an order that has already been delivered.",
    };
  }
  if (currentStatus === "SHIPPED") {
    return {
      allowed: false,
      status: 409,
      error:
        "Conflict: Cannot cancel an order that has already been shipped. Please initiate a return.",
    };
  }

  // 2. Verified admin authorization (app_metadata or verified database profile role),
  //    decided by the shared vocabulary so the set of admin-class roles cannot drift
  //    between this evaluator, the console gate and the database's is_admin().
  const isAdmin =
    isAdminRole(caller.app_metadata?.role as string | undefined) || isAdminRole(dbRole);

  if (isAdmin) {
    return { allowed: true, status: 200 };
  }

  // 3. Verified owner authorization — `user_id` only. See the note above this function.
  if (order.user_id) {
    if (order.user_id === caller.id) {
      return { allowed: true, status: 200 };
    }
    return {
      allowed: false,
      status: 403,
      error: "Forbidden: You do not have permission to cancel this order.",
    };
  }

  // 4. The order has no owner in the auth system. Either it was placed without signing in,
  //    or its owner's account was deleted — `orders.user_id` is
  //    `REFERENCES auth.users(id) ON DELETE SET NULL`, so deleting an account converts all
  //    of its past orders into this class. Only an administrator can cancel these.
  return {
    allowed: false,
    status: 403,
    error:
      "Forbidden: This order is not linked to your account. Please contact support to cancel it.",
  };
}
