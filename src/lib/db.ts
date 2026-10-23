import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { workerContext } from "@/lib/cloudflare";

// One client per request (keyed on the request's ExecutionContext) so nothing request-scoped is
// shared across requests on Workers. Under `next dev` the context comes from wrangler's local D1.
const perRequest = new WeakMap<object, PrismaClient>();

function getClient(): PrismaClient {
  const context = workerContext();
  if (!context?.env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Run the app with `npm run dev` or `npm run preview` (not `next start`).",
    );
  }
  let client = perRequest.get(context.ctx);
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaD1(context.env.DB) });
    perRequest.set(context.ctx, client);
  }
  return client;
}

/** Request-scoped Prisma client backed by Cloudflare D1; safe to import at module level. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
