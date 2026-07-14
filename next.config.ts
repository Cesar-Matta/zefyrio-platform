import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Anchor file tracing to the project dir (prevents Turbopack from
  // resolving tailwindcss from the OneDrive parent folder)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
