/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Scope and limits, stated honestly:
 * - Per serverless instance. On Vercel each warm lambda has its own map and
 *   cold starts reset it, so this is a deterrent and cost-amplification
 *   brake, NOT a global guarantee. Platform-level limiting (Vercel WAF /
 *   edge middleware) is still recommended for full protection.
 * - Keyed by caller-supplied bucket key; handlers prefix with the endpoint
 *   name and append the client IP so budgets are per-endpoint, per-client.
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract the best available client identifier from proxy headers.
 * Falls back to a shared bucket when no proxy headers exist (direct access,
 * local development) — limiting then applies globally, which is the safe
 * direction: it can false-positive throttle, never false-allow.
 */
export function getClientBucketKey(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const h = req.headers ?? {};
  const get = (name: string): string | undefined => {
    const v = h[name];
    return Array.isArray(v) ? v[0] : v;
  };
  const ip =
    get("x-forwarded-for")?.split(",")[0]?.trim() ||
    get("x-real-ip") ||
    get("cf-connecting-ip");
  return ip || "__global__";
}

/**
 * @param bucketKey Endpoint- and client-scoped key.
 * @param limit Max requests per window.
 * @param windowMs Window length in milliseconds.
 */
export function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound under spoofed
  // X-Forwarded-For values.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Standard 429 response with Retry-After. */
export function rateLimitResponse(
  res: { status: (n: number) => { json: (b: unknown) => unknown } },
  rl: RateLimitResult,
): unknown {
  return res
    .status(429)
    .json({
      error: "Too many requests. Please wait before trying again.",
      retryAfterSeconds: rl.retryAfterSeconds,
    });
}
