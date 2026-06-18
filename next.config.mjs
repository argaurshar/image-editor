// Static export for GitHub Pages.
// On Pages a project site is served from https://<user>.github.io/<repo>/,
// so the CI build sets NEXT_PUBLIC_BASE_PATH=/<repo>. Locally it's empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
