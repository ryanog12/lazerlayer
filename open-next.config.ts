import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every DB-backed route is dynamic and nothing uses ISR/revalidation, so prerendered pages can be
// served read-only from static assets without an extra cache bucket.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
