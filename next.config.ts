import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  // Ensure error pages are not statically generated
  output: "standalone",
};

export default nextConfig;
