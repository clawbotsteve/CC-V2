/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  // Handle libsodium-wrappers ESM compatibility
  serverExternalPackages: ['libsodium-wrappers', 'libsodium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix pnpm module resolution for libsodium-wrappers
      // Ensure libsodium is resolved correctly for ESM imports
      try {
        const libsodiumPath = require.resolve('libsodium');
        config.resolve.alias = {
          ...config.resolve.alias,
          'libsodium': libsodiumPath,
        };
        // Also add to fallback for dynamic imports
        config.resolve.fallback = {
          ...config.resolve.fallback,
          'libsodium': libsodiumPath,
        };
      } catch (e) {
        console.warn('Could not resolve libsodium for webpack alias:', e);
      }
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "creatorcore-ugc.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v3.fal.media",
        pathname: "/**",
      },
      // FAL serves generated images from multiple subdomains depending
      // on the model (v2.fal.media, cdn.fal.media, fal.media bare).
      // Whitelisting the wildcard covers all of them without us having
      // to chase every model's specific CDN. Came up first when
      // Character Studio's GPT Image 2 + Nano Banana 2 Edit outputs
      // failed to render in the wizard (#46 follow-up).
      {
        protocol: "https",
        hostname: "**.fal.media",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fal.media",
        pathname: "/**",
      },
      // Replicate's output CDN. All model outputs (openai/gpt-image-2,
      // google/nano-banana-2, black-forest-labs/flux-*, kling, seedance,
      // topaz, etc.) are served from replicate.delivery once the
      // prediction completes. Wildcard covers any future subdomain
      // splits the same way we did for fal.media.
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.replicate.delivery",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)", // apply to all routes
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://us.i.posthog.com/flags",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
