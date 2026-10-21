import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets OpenNext swap in Prisma's Workers-compatible build when bundling for Cloudflare.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // pg loads pg-cloudflare only under the `workerd` export condition, which Next's file tracing
  // doesn't follow, so the Workers socket implementation must be included explicitly.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pg-cloudflare/dist/**"],
  },
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
