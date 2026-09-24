/**
 * Tests for the Vercel-to-Deno adapter and the CORS module.
 *
 * These exist because the adapter is the one piece of genuinely new logic on the payment
 * path. Vitest covers `api/*.ts` thoroughly -- 164 tests, including HMAC verification and
 * payment idempotency -- but Vitest calls those handlers directly with a mock req/res and
 * never sees this translation layer. Deno is a separate runtime the Vitest suite cannot
 * load, so without this file the code standing between a customer's request and the payment
 * verifier would ship untested.
 *
 * Run:  deno test -A --config supabase/functions/deno.json supabase/functions/_shared/
 *
 * Deliberately uses stub handlers rather than the real ones for the adapter cases: the point
 * is to pin the translation contract (status, body, headers, error paths) independently of
 * any business rule. The final group does load the real handlers, but only for branches that
 * return before touching the network.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { serveVercelHandler } from "./vercel-adapter.ts";
import type { VercelRequest, VercelResponse } from "./vercel-types.ts";

const ORIGIN = "https://shop.example.com";

/** Set for the whole file: CORS is configuration-driven, so unset means "deny everything". */
Deno.env.set("ALLOWED_ORIGINS", `${ORIGIN},https://www.example.com`);

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://fn.example.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------------------

Deno.test("OPTIONS preflight answers 204 without invoking the handler", async () => {
  let invoked = false;
  const serve = serveVercelHandler((_req, res) => {
    invoked = true;
    return res.status(200).json({ ok: true });
  });

  const res = await serve(
    new Request("https://fn.example.com/", { method: "OPTIONS", headers: { origin: ORIGIN } }),
  );

  assertEquals(res.status, 204);
  assertEquals(invoked, false, "preflight must not reach the handler");
  assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
  assertStringIncludes(res.headers.get("access-control-allow-headers") ?? "", "authorization");
  await res.body?.cancel();
});

// ---------------------------------------------------------------------------------------
// CORS. A wrong answer here is invisible to curl and breaks only real browsers, which is
// exactly the kind of bug worth a test.
// ---------------------------------------------------------------------------------------

Deno.test("an allowed origin is echoed back", async () => {
  const serve = serveVercelHandler((_req, res) => res.status(200).json({ ok: true }));
  const res = await serve(post({}));
  assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
  await res.json();
});

Deno.test("an unlisted origin gets no allow-origin header", async () => {
  const serve = serveVercelHandler((_req, res) => res.status(200).json({ ok: true }));
  const res = await serve(post({}, { origin: "https://attacker.example" }));
  assertEquals(res.headers.get("access-control-allow-origin"), null);
  await res.json();
});

Deno.test(
  "Vary: Origin is always set, so a cache cannot cross-serve the allow header",
  async () => {
    const serve = serveVercelHandler((_req, res) => res.status(200).json({ ok: true }));
    for (const origin of [ORIGIN, "https://attacker.example"]) {
      const res = await serve(post({}, { origin }));
      assertEquals(res.headers.get("vary"), "Origin");
      await res.json();
    }
  },
);

Deno.test("error responses carry CORS too, or the client sees a network fault", async () => {
  const serve = serveVercelHandler((_req, res) => res.status(400).json({ error: "bad input" }));
  const res = await serve(post({}));
  assertEquals(res.status, 400);
  assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
  assertEquals((await res.json()).error, "bad input");
});

// ---------------------------------------------------------------------------------------
// Request translation
// ---------------------------------------------------------------------------------------

Deno.test("JSON body is parsed before the handler runs", async () => {
  let seen: unknown = null;
  const serve = serveVercelHandler((req: VercelRequest, res: VercelResponse) => {
    // The destructuring guard every real handler uses. An unread stream would break it.
    const { items, couponCode } = req.body || {};
    seen = { items, couponCode };
    return res.status(200).json({ ok: true });
  });

  await (await serve(post({ items: [{ id: "p1", qty: 2 }], couponCode: "SAVE10" }))).json();
  assertEquals(seen, { items: [{ id: "p1", qty: 2 }], couponCode: "SAVE10" });
});

Deno.test("malformed JSON becomes {} so the handler's own validation reports it", async () => {
  let seen: unknown = "untouched";
  const serve = serveVercelHandler((req: VercelRequest, res: VercelResponse) => {
    seen = req.body;
    const { items } = req.body || {};
    return res.status(400).json({ error: "Missing items", items: items ?? null });
  });

  const res = await serve(post("{not json at all"));
  // The adapter must not throw: a 500 here would mask the handler's specific 400.
  assertEquals(res.status, 400);
  assertEquals(seen, {});
  await res.json();
});

Deno.test("an empty body becomes {} rather than throwing", async () => {
  const serve = serveVercelHandler((req: VercelRequest, res: VercelResponse) =>
    res.status(200).json({ body: req.body }),
  );
  const res = await serve(
    new Request("https://fn.example.com/", { method: "POST", headers: { origin: ORIGIN } }),
  );
  assertEquals((await res.json()).body, {});
});

Deno.test("header names are lower-cased so req.headers.authorization resolves", async () => {
  let token = "";
  const serve = serveVercelHandler((req: VercelRequest, res: VercelResponse) => {
    token = req.headers.authorization || "";
    return res.status(200).json({ ok: true });
  });

  // Sent capitalised, as a browser does; read as a plain lower-case property, as Vercel allows.
  await (await serve(post({}, { Authorization: "Bearer abc123" }))).json();
  assertEquals(token, "Bearer abc123");
});

Deno.test("the method is passed through for the handlers' 405 guard", async () => {
  let method = "";
  const serve = serveVercelHandler((req: VercelRequest, res: VercelResponse) => {
    method = req.method;
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  });
  const res = await serve(new Request("https://fn.example.com/", { method: "GET" }));
  assertEquals(method, "GET");
  assertEquals(res.status, 405);
  await res.json();
});

// ---------------------------------------------------------------------------------------
// Response translation
// ---------------------------------------------------------------------------------------

Deno.test("status and JSON body survive the round trip", async () => {
  const serve = serveVercelHandler((_req, res) =>
    res.status(201).json({ success: true, orderRef: "VRD-260824-ABCD1234" }),
  );
  const res = await serve(post({}));
  assertEquals(res.status, 201);
  assertStringIncludes(res.headers.get("content-type") ?? "", "application/json");
  assertEquals(await res.json(), { success: true, orderRef: "VRD-260824-ABCD1234" });
});

Deno.test("res.json() without status defaults to 200, as on Vercel", async () => {
  const serve = serveVercelHandler((_req, res) => res.json({ ok: true }));
  const res = await serve(post({}));
  assertEquals(res.status, 200);
  await res.json();
});

Deno.test("the first write wins when a handler writes twice", async () => {
  const serve = serveVercelHandler((_req, res) => {
    res.status(403).json({ error: "Forbidden" });
    // A second write in Node throws once headers are flushed; here it must be ignored so
    // the status the handler decided on first is the one the caller receives.
    return res.status(200).json({ success: true });
  });
  const res = await serve(post({}));
  assertEquals(res.status, 403);
  assertEquals(await res.json(), { error: "Forbidden" });
});

Deno.test("status() is chainable and returns the response object", async () => {
  const serve = serveVercelHandler((_req, res) => {
    const chained = res.status(418);
    assert(chained === res, "status() must return the response for chaining");
    return chained.json({ ok: true });
  });
  assertEquals((await serve(post({}))).status, 418);
});

// ---------------------------------------------------------------------------------------
// Failure paths
// ---------------------------------------------------------------------------------------

Deno.test("a throwing handler yields 500 and leaks nothing", async () => {
  const serve = serveVercelHandler(() => {
    throw new Error("connection to db-internal-7.private failed: password=hunter2");
  });
  const res = await serve(post({}));
  const body = await res.text();

  assertEquals(res.status, 500);
  assertEquals(JSON.parse(body), { error: "Internal server error." });
  assert(!body.includes("hunter2"), "must not return the thrown message to the client");
  assert(!body.includes("db-internal-7"), "must not return internal hostnames");
  assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
});

Deno.test("a rejected promise is caught like a synchronous throw", async () => {
  const serve = serveVercelHandler(() => Promise.reject(new Error("async boom")));
  const res = await serve(post({}));
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, "Internal server error.");
});

Deno.test("a handler that writes nothing yields 500 rather than hanging", async () => {
  const serve = serveVercelHandler(() => {
    /* returns without calling res */
  });
  const res = await serve(post({}));
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, "Internal server error.");
});

// ---------------------------------------------------------------------------------------
// The real handlers, on branches that return before any network call.
//
// This is the part that proves the whole composition loads under Deno: the api/ module, its
// `node:crypto` and `node:buffer` imports, the npm: supabase-js resolution, and the relative
// `../src/lib/*.ts` imports all have to resolve for these to run at all.
// ---------------------------------------------------------------------------------------

Deno.test("real handlers: every one rejects a non-POST with 405", async () => {
  const handlers = {
    "create-razorpay-order": (await import("../../../api/create-razorpay-order.ts")).default,
    "verify-razorpay-payment": (await import("../../../api/verify-razorpay-payment.ts")).default,
    "cancel-order": (await import("../../../api/cancel-order.ts")).default,
    "revalidate-cart": (await import("../../../api/revalidate-cart.ts")).default,
  };

  for (const [name, handler] of Object.entries(handlers)) {
    const res = await serveVercelHandler(handler)(
      new Request("https://fn.example.com/", { method: "GET", headers: { origin: ORIGIN } }),
    );
    assertEquals(res.status, 405, `${name} should reject GET`);
    assertStringIncludes((await res.json()).error, "Method not allowed");
  }
});

Deno.test("real handler: cancel-order refuses a request with no bearer token", async () => {
  const handler = (await import("../../../api/cancel-order.ts")).default;
  const res = await serveVercelHandler(handler)(post({ orderId: "VRD-260824-AAAAAAAA" }));

  // 401 from the handler's own auth check, or 500 if it fails closed on absent Supabase
  // config first. Either is a refusal; what must never happen is a 200.
  assert(res.status === 401 || res.status === 500, `expected 401 or 500, got ${res.status}`);
  await res.body?.cancel();
});
