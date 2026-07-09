import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

// Generated per-request (not prerendered at build) — mirrors the /listeners
// page, which also reads Firestore with the client SDK. Firebase is imported
// lazily inside the function so `next build` never initializes it (no env at
// build time); reads are wrapped so a failure degrades to the static routes.
export const dynamic = 'force-dynamic';

// Same public-visibility gate the browse page and profile pages use:
// a profile is public only when isSetUp !== false AND not soft-deleted.
async function publicProfileIds(coll: 'listeners' | 'pitchers'): Promise<string[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { firestore } = await import('@/firebase/clientApp');
    const snap = await getDocs(collection(firestore, coll));
    return snap.docs
      .filter((d) => {
        const x = d.data() as { isSetUp?: boolean; deletedAt?: unknown };
        return x.isSetUp !== false && !x.deletedAt;
      })
      .map((d) => d.id);
  } catch (err) {
    console.error(`[sitemap] failed to read ${coll}`, err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/listeners`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/pitcher/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/listener/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const [listeners, pitchers] = await Promise.all([
    publicProfileIds('listeners'),
    publicProfileIds('pitchers'),
  ]);

  const profileRoutes: MetadataRoute.Sitemap = [
    ...listeners.map((id) => ({
      url: `${BASE}/listener/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...pitchers.map((id) => ({
      url: `${BASE}/pitcher/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...profileRoutes];
}
