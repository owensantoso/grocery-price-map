import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const formActionOrigins = ["'self'", "https://*.vercel.app", "http://localhost:3000"];

if (siteUrl) {
  try {
    formActionOrigins.push(new URL(siteUrl).origin);
  } catch {
    // Ignore invalid env here; runtime auth config validates production URL separately.
  }
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              `form-action ${[...new Set(formActionOrigins)].join(" ")}`,
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org",
              "connect-src 'self' https://*.supabase.co",
              "font-src 'self'",
              "worker-src 'self' blob:",
              "object-src 'none'",
            ].join("; "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), usb=(), browsing-topics=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
