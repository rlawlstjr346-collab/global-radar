import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages are served read-only from Workers Static Assets (free, no KV/R2 writes).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
