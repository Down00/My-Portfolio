import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional: Generate static HTML for pages that are pre-rendered
  trailingSlash: true,  // Optional, generates a trailing slash for static URLs

  // Optionally, customize the build output folder (if you want to specify a different folder than `out`)
  distDir: 'out',  // Firebase Hosting expects static files in the 'out' folder

  // Other Next.js configurations can go here
};

export default nextConfig;
