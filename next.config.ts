import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // Silenciar warning de webpack config
};

// @ts-ignore - next-pwa no tiene tipos oficiales
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
