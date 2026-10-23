import { getCloudflareContext, type CloudflareContext } from "@opennextjs/cloudflare";

/**
 * The Cloudflare request context on Workers (`npm run preview` / deployed) or from wrangler's local
 * emulation under `next dev`; null under plain Node.js without it (`next start`, scripts).
 */
export function workerContext(): CloudflareContext | null {
  try {
    return getCloudflareContext();
  } catch {
    return null;
  }
}
