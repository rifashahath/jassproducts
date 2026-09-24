/**
 * Runs a Vercel-style handler from `api/` on the Deno Edge Runtime.
 *
 * Why an adapter instead of four rewritten handlers
 * -------------------------------------------------
 * The migration plan called for hand-porting each handler to native Deno. Reading the test
 * suite first changed the answer: `tests/{payment-idempotency,payment-security,
 * payment-order-creation,pricing-authority,stock-atomicity}.test.ts` load the real handler
 * modules by path and drive them through a mock request -- 25 import sites covering all four
 * handlers.
 *
 * A rewrite would therefore have produced two copies of the HMAC signature check, the
 * idempotency guard, the pricing authority and the fail-closed branches, with the whole test
 * suite pointed at the copy that was about to stop serving traffic. The deployed payment path
 * would have had no tests at all, and every later fix would have to be remembered twice. For
 * signature verification and money handling that is not a trade worth making.
 *
 * So `api/*.ts` remains the single implementation and this file adapts the calling
 * convention. The handlers keep their logic untouched: no diff to review on the
 * security-critical code, and the tests keep covering exactly what production runs.
 *
 * The surface being adapted is small enough to enumerate, which is what makes this safe.
 * Across all four handlers: `req.method` (4 uses), `req.body` (4), `req.headers.authorization`
 * (1), and `res.status(n).json(o)` (49, every one chaining `.json` on the same line). No
 * cookies, no query parameters, no streaming, no `setHeader`, no `res.end`. `vercel-types.ts`
 * pins that surface so a handler cannot quietly grow past it.
 */

import { corsHeaders, jsonResponse, preflightResponse } from "./cors.ts";
import type { VercelRequest, VercelResponse } from "./vercel-types.ts";

/**
 * Convert a Web `Request` into the shape the handlers expect.
 *
 * Body parsing is the part that matters. On Vercel `req.body` arrives already parsed; in Deno
 * the body is an unread stream, and `req.body || {}` -- the destructuring guard every handler
 * uses -- would see a `ReadableStream` as truthy and then destructure `undefined` out of it.
 * A valid order would be rejected for missing fields. So the JSON is parsed here.
 *
 * A malformed body becomes `{}` rather than throwing, so the handler's own validation
 * produces the error, with its own status and message, instead of this adapter failing before
 * the handler is ever entered.
 *
 * Header names are lower-cased because `req.headers.authorization` is a plain property access
 * on Vercel, whereas `Headers.get()` is case-insensitive; lower-casing preserves the lookup.
 */
async function adaptRequest(req: Request): Promise<VercelRequest> {
  let body: unknown = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      // Unparseable JSON, left as {} deliberately -- see the note above.
      body = {};
    }
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of req.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }

  return { method: req.method, body, headers };
}

/**
 * Wrap a handler so it can be passed to `Deno.serve`.
 *
 * `res.status().json()` is fire-and-forget on Vercel -- the handler calls it and returns --
 * whereas Deno needs a `Response` handed back from the request callback. The captured value
 * bridges that: whatever the handler wrote becomes the real response once it finishes.
 */
export function serveVercelHandler(
  handler: (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return preflightResponse(req);
    }

    let captured: { status: number; body: unknown } | null = null;
    // Set by `status()`, consumed by `json()` -- the same split Express and Vercel use, so a
    // bare `res.json(x)` with no preceding `status()` still answers 200 as it does there.
    let pendingStatus = 200;

    const res: VercelResponse = {
      status: (statusCode: number) => {
        pendingStatus = statusCode;
        return res;
      },
      json: (jsonBody: unknown) => {
        // First write wins, mirroring Node: once headers are flushed there a second write
        // throws. Several handlers return early on one branch while a later branch remains
        // reachable in principle, so keeping the first preserves the status they decided on.
        if (captured === null) captured = { status: pendingStatus, body: jsonBody };
        return res;
      },
    };

    try {
      const adapted = await adaptRequest(req);
      await handler(adapted, res);
    } catch (err) {
      // A throw that escaped the handler. Logged with detail server-side; the client is told
      // only that it failed, since the message can name internal tables or configuration.
      console.error("Unhandled error in adapted handler:", err);
      return jsonResponse(req, 500, { error: "Internal server error." });
    }

    if (captured === null) {
      // The handler returned without writing. On Vercel this is a hung request the platform
      // eventually times out; answering 500 makes it visible in logs instead of reaching the
      // caller as an unexplained network fault.
      console.error("Adapted handler returned without sending a response.");
      return jsonResponse(req, 500, { error: "Internal server error." });
    }

    const { status, body } = captured as { status: number; body: unknown };
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  };
}
