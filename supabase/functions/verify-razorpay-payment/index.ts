/**
 * Edge Function entrypoint for POST /functions/v1/verify-razorpay-payment
 *
 * Transport only. The logic lives in `api/verify-razorpay-payment.ts`, which is the same module the
 * Vercel deployment serves and the same one the test suite exercises -- see the reasoning in
 * `../_shared/vercel-adapter.ts`. Nothing here should ever grow a business rule: anything
 * added at this layer would run in production untested.
 */

import handler from "../../../api/verify-razorpay-payment.ts";
import { serveVercelHandler } from "../_shared/vercel-adapter.ts";

Deno.serve(serveVercelHandler(handler));
