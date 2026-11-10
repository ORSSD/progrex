import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { listProjects } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const projects = await listProjects();
  return [
    { url: `${origin}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${origin}/work`, changeFrequency: 'weekly', priority: 0.8 },
    ...projects.map((p) => ({
      url: `${origin}/work/${p.slug}`,
      lastModified: new Date(p.updatedAt.replace(' ', 'T') + 'Z'),
      priority: 0.6,
    })),
  ];
}
