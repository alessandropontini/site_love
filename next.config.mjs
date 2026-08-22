/** @type {import("next").NextConfig} */
const isDevelopment = process.env.NODE_ENV === "development";
const configuredClerkFrontendApi =
  process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL?.trim() ?? "";
const clerkFrontendApiSource = /^https:\/\/[A-Za-z0-9.-]+$/.test(
  configuredClerkFrontendApi
)
  ? ` ${configuredClerkFrontendApi}`
  : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com${clerkFrontendApiSource}${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://img.clerk.com",
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com:*${clerkFrontendApiSource}${isDevelopment ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com https://*.protect.clerk.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  },
  ...(!isDevelopment
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains"
        }
      ]
    : [])
];

const privateRouteHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }
];

const nextConfig = {
  allowedDevOrigins: isDevelopment ? ["192.168.1.3"] : [],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/rsvp/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/api/rsvp/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/admin/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/sign-in/:path*",
        headers: privateRouteHeaders
      }
    ];
  }
};

export default nextConfig;
