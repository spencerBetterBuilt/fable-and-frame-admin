import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the marketing site's repo root, which has its own
  // lockfile — pin the workspace root so Turbopack doesn't try to infer it.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
