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
  // Even if a non-image ever got in, the browser must not sniff or run it.
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-security-policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  headers.set('cross-origin-resource-policy', 'same-origin');
  return new Response(obj.body as unknown as BodyInit, { headers });
}
