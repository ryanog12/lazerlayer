import { getCloudflareContext } from "@opennextjs/cloudflare";

type WorkerContext = ReturnType<typeof getCloudflareContext>;

/**
 * The Cloudflare request context when running on Workers (`npm run preview` / deployed),
 * or null under plain Node.js (`next dev`, `next start`, scripts).
 */
export function workerContext(): WorkerContext | null {
  try {
    return getCloudflareContext();
  } catch {
    return null;
  }
}
