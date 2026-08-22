const localOrigin = "http://localhost:3000";

function resolveSiteOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidate =
    configuredOrigin ??
    (vercelProductionHost
      ? `https://${vercelProductionHost}`
      : localOrigin);

  try {
    return new URL(candidate);
  } catch {
    return new URL(localOrigin);
  }
}

export const siteOrigin = resolveSiteOrigin();
