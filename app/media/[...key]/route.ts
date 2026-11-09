import { bindings } from '@/lib/db';

/** Serves uploaded project images from R2 storage. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const bucket = bindings().MEDIA;
  if (!bucket) return new Response('Not found', { status: 404 });
  const obj = await bucket.get(key.map(decodeURIComponent).join('/'));
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body as unknown as BodyInit, { headers });
}
