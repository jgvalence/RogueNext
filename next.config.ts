import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add your CDN/image domains here
      // {
      //   protocol: "https",
      //   hostname: "example.com",
      // },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache, max-age=0" }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable if using server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withPWA({
  dest: "public",
  cacheStartUrl: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  // Fetch card, enemy and room paintings as they are viewed, without precaching them.
  publicExcludes: [
    "!noprecache/**/*",
    "!images/cards/painted-v1/**/*",
    "!images/enemies/painted-v1/**/*",
    "!images/rooms/painted-v1/**/*",
  ],
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/images\/rooms\/painted-v1\/.*\.webp$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "room-paintings-v1",
          expiration: { maxEntries: 90, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        urlPattern: /\/images\/enemies\/painted-v1\/.*\.webp$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "enemy-paintings-v1",
          expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        urlPattern: /\/images\/cards\/painted-v1\/.*\.webp$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "card-paintings-v1",
          expiration: { maxEntries: 180, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        urlPattern: /\/api\/|\/game(?:\/|$)|\/library(?:\/|$)|\/runs(?:\/|$)/,
        handler: "NetworkOnly",
      },
    ],
  },
})(nextConfig);
