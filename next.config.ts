import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Custom-request STL uploads can be up to 50 MB.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
