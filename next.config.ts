import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'dgalywyr863hv.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'd3o5xota0a1f83.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'maps.geoapify.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
    ],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@anthropic-ai/sdk'],
  },
};

export default nextConfig;
