import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// @ts-ignore - next-pwa no tiene tipos oficiales
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
