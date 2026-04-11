/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    NEXT_PUBLIC_EXPLORER_BASE: process.env.NEXT_PUBLIC_EXPLORER_BASE || "https://testnet.snowtrace.io",
  },
};

module.exports = nextConfig;
