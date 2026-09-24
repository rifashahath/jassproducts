/**
 * Deno-side stand-ins for the two type-only names `api/*.ts` imports from "@vercel/node".
 *
 * `deno.json` maps the "@vercel/node" specifier here. The imports in the handlers are
 * `import type`, so nothing is loaded at runtime -- but `deno check` still has to resolve
 * the specifier, and the real package cannot be used for it: it pulls @types/node 20.11
 * into a graph that already has 22.x, which is the duplicate-global-declarations problem
 * `types/vercel-node.d.ts` documents at length.
 *
 * These are narrower than upstream on purpose. They declare exactly the members the four
 * handlers touch -- `method`, `body` and `headers` on the request; `status` and `json` on
 * the response -- and exactly what `vercel-adapter.ts` supplies. Narrow is the useful
 * direction: if a handler ever starts reading `req.query` or calling `res.setHeader`, this
 * fails at `deno check` time with a named missing property, rather than reaching production
 * and reading `undefined` from an object the adapter never populated.
 *
 * Note the seam this creates: `npm run typecheck` checks the handlers against
 * `types/vercel-node.d.ts` (the full upstream shape), while `deno check` checks them against
 * this file. Both must pass, so the effective contract is the intersection -- stricter than
 * either alone, never looser. Keep the two in step when either changes.
 */

/** Chainable, mirroring upstream: both `status()` and `json()` return the response. */
export interface VercelResponse {
  status(statusCode: number): VercelResponse;
  json(jsonBody: unknown): VercelResponse;
}

export interface VercelRequest {
  method: string;
  /**
   * Already-parsed JSON. The adapter reads and parses the stream before the handler runs.
   *
   * `any`, not `unknown`, matching upstream's `VercelRequestBody = any` for the same reason
   * `types/vercel-node.d.ts` gives: every handler destructures this directly
   * (`const { items } = req.body || {}`), which `unknown` rejects outright. Declaring it
   * stricter than the package being stood in for would fail deno check on handler code that
   * Vercel accepts and the tests already cover. `no-explicit-any` is excluded in deno.json.
   */
  // deno-lint-ignore no-explicit-any
  body: any;
  /** Lower-cased header names, so `headers.authorization` works as a plain property access. */
  headers: Record<string, string>;
}
