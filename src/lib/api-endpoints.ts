/**
 * Resolves the URL for a server-side handler.
 *
 * The four handlers used to sit at `/api/<name>` on the same Vercel origin as the SPA, so
 * every call site hardcoded a relative path. Splitting the deployment -- pages on Cloudflare,
 * handlers on Supabase Edge Functions -- makes the origin configuration rather than a
 * constant, and this is the single place that knows it.
 *
 * `VITE_API_BASE_URL` unset falls back to the original relative `/api/<name>`. That default
 * matters during the migration: the existing Vercel deployment keeps working with no code
 * change and stays available as a rollback target, so the cutover is a build-time variable
 * rather than a commit. Set it to the functions base once the Edge Functions are verified:
 *
 *   VITE_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
 *
 * Note the endpoint names below deliberately match both the `api/*.ts` filenames and the
 * `supabase/functions/*` directory names, which is what lets one identifier address either
 * deployment.
 */

/**
 * Every handler the browser may call. A union rather than `string` so a mistyped endpoint is
 * a build failure instead of a 404 discovered during a customer's checkout.
 */
export type ApiEndpoint =
  "create-razorpay-order" | "verify-razorpay-payment" | "revalidate-cart" | "cancel-order";

/**
 * Trailing slashes are trimmed because the value is operator-supplied through a dashboard
 * field, where `.../functions/v1/` and `.../functions/v1` are both natural to type. Without
 * this, one of them yields `//create-razorpay-order` -- which Supabase's router treats as a
 * different, non-existent path.
 */
function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured !== "string" || configured.trim() === "") return "/api";
  return configured.trim().replace(/\/+$/, "");
}

export function apiUrl(endpoint: ApiEndpoint): string {
  return `${resolveBaseUrl()}/${endpoint}`;
}

/**
 * Parses a handler's successful response, refusing anything that is not actually JSON.
 *
 * `res.ok` alone is not enough to conclude a handler answered. Cloudflare serves this SPA
 * with `assets.not_found_handling = "single-page-application"`, so a request to a path that
 * is not a built asset -- `/api/create-razorpay-order`, whenever `VITE_API_BASE_URL` is
 * unset -- comes back as `200 text/html` carrying index.html. `res.ok` is true, and
 * `res.json()` then throws `SyntaxError: Unexpected token '<'` straight at the customer.
 *
 * Checking the content type converts that into a diagnosis. It also covers the case this
 * outlives: a `VITE_API_BASE_URL` pointing somewhere that serves an HTML error page.
 */
export async function readJsonResponse<T>(res: Response, endpoint: ApiEndpoint): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `The '${endpoint}' endpoint returned ${contentType || "no content type"} rather than JSON ` +
        `(HTTP ${res.status}). The server-side handlers are most likely not reachable at ` +
        `'${resolveBaseUrl()}' -- check VITE_API_BASE_URL. No order or payment was processed.`,
    );
  }
  return (await res.json()) as T;
}
