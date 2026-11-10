import { NextResponse, type NextRequest } from 'next/server';
import { adminBase } from '@/lib/admin-path';

/** Sent on every page. Kept compatible with the inline scripts React uses to hydrate. */
const SECURITY_HEADERS: Record<string, string> = {
  // Nobody may frame the site (stops clickjacking on the admin).
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const KB = 1024;
const MAX_CONTACT_BODY = 64 * KB; // the contact form is a few short fields
const MAX_ADMIN_BODY = 6 * 1024 * KB; // a 5 MB cover image plus the project fields

function secure(res: NextResponse, isAdmin = false) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  if (isAdmin) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

/**
 * Reads a request body to the end and throws it away, chunk by chunk (nothing is buffered).
 * The `wrangler dev` server that runs production can stall or crash when a response is sent
 * while the request body is still unread, so every request with a body must be drained.
 */
async function drain(body: ReadableStream<Uint8Array> | null) {
  if (!body) return;
  const reader = body.getReader();
  try {
    while (!(await reader.read()).done) {
      /* discard */
    }
  } catch {
    /* client went away */
  }
}

async function reject(request: NextRequest, status: number, allow?: string) {
  await drain(request.body);
  return secure(new NextResponse(null, { status, headers: allow ? { Allow: allow } : undefined }));
}

/**
 * 1. Only lets requests with a body through where the site really accepts forms: the contact
 *    form on the home page and the admin. Everything else gets 405 before it reaches the app,
 *    which also shields the runtime from malformed POSTs (one could crash `wrangler dev`).
 * 2. Serves the admin only at the secret ADMIN_PATH; the internal /admin route answers 404.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const base = adminBase();
  const under = (p: string) => pathname === `/${p}` || pathname.startsWith(`/${p}/`);
  const inAdmin = Boolean(base && under(base));

  if (method !== 'GET' && method !== 'HEAD') {
    const allowed = method === 'POST' && (pathname === '/' || inAdmin);
    if (!allowed) return reject(request, 405, pathname === '/' || inAdmin ? 'GET, HEAD, POST' : 'GET, HEAD');
    const length = Number(request.headers.get('content-length') ?? 'NaN');
    if (!Number.isFinite(length)) return reject(request, 411); // chunked uploads have no size to check
    if (length > (inAdmin ? MAX_ADMIN_BODY : MAX_CONTACT_BODY)) return reject(request, 413);
    // Accepted: read the whole body now (size already capped above). The app gets its own copy,
    // so even if it answers without reading it (e.g. an unknown action ID), nothing is left unread.
    await drain(request.clone().body);
  }

  // Uploaded images carry their own stricter headers (see app/media).
  if (pathname.startsWith('/media/')) return NextResponse.next();

  if (inAdmin && base) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname.slice(base.length + 1)}`;
    return secure(NextResponse.rewrite(url), true);
  }
  if (under('admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/__not-found';
    return secure(NextResponse.rewrite(url));
  }
  return secure(NextResponse.next());
}

export const config = {
  // Everything except built static files, so the method guard covers media and metadata routes too.
  matcher: ['/((?!_next/static/|favicon|icon).*)'],
};
