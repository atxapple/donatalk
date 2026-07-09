import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

// Public: /, /listeners, /login, signup pages, and public profiles /{role}/{uid}.
// Private (crawlers excluded): admin, API, auth-gated dashboards and money flows.
// NOTE: disallow specific sub-paths, never the bare /pitcher or /listener prefix —
// that would block the public profile pages we want indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/choose-a-profile',
          '/checkout',
          '/pitcher/add-fund',
          '/pitcher/update-profile',
          '/pitcher/profile',
          '/listener/update-profile',
          '/listener/profile',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
