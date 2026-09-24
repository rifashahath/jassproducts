/**
 * CORS for the Edge Functions.
 *
 * New code, not a port. On Vercel the SPA and `api/*` shared one origin, so no handler in
 * `api/` sets a single CORS header and none needed to. Splitting the deployment -- pages on
 * Cloudflare, functions on `<ref>.supabase.co` -- makes every call cross-origin, so the
 * browser now requires this before it will hand any response body to `fetch`.
 */

/**
 * Origins allowed to call these functions.
 *
 * Read from the `ALLOWED_ORIGINS` secret as a comma-separated list, e.g.
 *   supabase secrets set ALLOWED_ORIGINS="https://asterdecorz.com,https://www.asterdecorz.com"
 *
 * Deliberately not `*`. `cancel-order` reads a bearer token out of the Authorization
 * header, and `Access-Control-Allow-Origin: *` is incompatible with credentialed requests
 * -- but more to the point, a wildcard would let any page on the internet issue
 * authenticated calls with a token it had obtained and read the replies. The list is
 * configuration rather than a constant here because the production domain, the Pages
 * preview domains and localhost differ per environment and must not require a code change.
 */
function allowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Echo the request's origin only when it is on the list.
 *
 * `Access-Control-Allow-Origin` takes one origin, not a list, so with several permitted
 * domains the value has to be chosen per request. An origin that is absent or unlisted
 * yields no header at all, which is what makes the browser block the read.
 *
 * `Vary: Origin` is not optional. Without it a shared cache can serve the
 * `Allow-Origin: https://a.example` response to a request from `https://b.example`, either
 * breaking a legitimate caller or leaking a permission it was not granted.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  const list = allowedOrigins();
  if (origin && list.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * Preflight response.
 *
 * 204 with no body. The browser sends `OPTIONS` before any request carrying an
 * `Authorization` or `Content-Type: application/json` header -- which is all four of these
 * endpoints -- and will not send the actual POST until this succeeds.
 */
export function preflightResponse(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * JSON response with CORS applied.
 *
 * Every exit path must go through this, error paths included. A 400 or 500 returned without
 * the CORS headers does not reach the client as a 400 or 500: `fetch` rejects on the CORS
 * check first, so the SPA sees an opaque `TypeError: Failed to fetch` and reports a network
 * problem instead of the validation message the handler took care to produce. That failure
 * mode is invisible in curl, which does not enforce CORS -- it only appears in a browser.
 */
export function jsonResponse(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
