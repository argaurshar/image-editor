/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Base64 images can exceed the default Server Action body size; bump it.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
