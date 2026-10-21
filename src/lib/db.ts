import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { workerContext } from "@/lib/cloudflare";

function createClient(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function connectionString() {
  // Prefer Cloudflare Hyperdrive (pooled, edge-cached connections) when the binding is configured.
  const hyperdrive = workerContext()?.env.HYPERDRIVE;
  const url = hyperdrive?.connectionString ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  return url;
}

// Workers forbid sharing sockets between requests, so on Workers each request gets its own
// client (and connection pool). Under Node.js a single client is reused.
const perRequest = new WeakMap<object, PrismaClient>();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  const ctx = workerContext()?.ctx;
  if (ctx) {
    let client = perRequest.get(ctx);
    if (!client) {
      client = createClient(connectionString());
      perRequest.set(ctx, client);
    }
    return client;
  }
  globalForPrisma.prisma ??= createClient(connectionString());
  return globalForPrisma.prisma;
}

/** Request-scoped Prisma client; safe to import at module level on both Node.js and Workers. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
