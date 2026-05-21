/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prevent bundler from trying to tree-shake server-only KV client
    serverComponentsExternalPackages: ["@vercel/kv"],
  },
};

module.exports = nextConfig;
