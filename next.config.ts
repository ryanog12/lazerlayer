import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Lets OpenNext swap in Prisma's Workers-compatible build when bundling for Cloudflare.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    // Workers have no built-in image optimizer; images are served as-is.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Custom-request STL uploads can be up to 50 MB.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;

// Gives `next dev` the local D1 database and R2 bucket from wrangler.jsonc (stored in .wrangler/state).
initOpenNextCloudflareForDev();
