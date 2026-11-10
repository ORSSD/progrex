# Progrex Portfolio

The bilingual Progrex technology studio portfolio (English and Arabic/RTL), built with React, Vinext, Vite, and Tailwind CSS.

Projects, labs and contact-form messages live in a database and are managed from a password-protected
admin dashboard (path below) — no code changes or redeploys needed to add work.

## What's in the site

- **Home** — hero, approach, featured work, capabilities (with live project counts), labs, studio principles, contact.
- **/work** — every published project, filterable by discipline (Build / Intelligence / Secure) or Labs.
- **/work/[slug]** — case study page generated from the project's data: question, what we built, system flow,
  outcomes, stack, links, and a "next project" link.
- **Contact form** — saves briefs to the database; read them in the admin Inbox.
- **English / Arabic** — the header toggle switches language (remembered in a cookie). Arabic uses IBM Plex Sans Arabic
  and a full right-to-left layout. Any Arabic field left empty falls back to English.
- `sitemap.xml` and `robots.txt` are generated from the published projects.

## Admin

The admin lives at a secret path set by the **`ADMIN_PATH`** environment variable (e.g. `ADMIN_PATH=my-secret-path`
→ `https://yoursite/my-secret-path`). The path is not in the code, the browser bundles, `robots.txt` or any link,
so scanners can't find it. The internal `/admin` route answers 404. If `ADMIN_PATH` is unset, the admin is unreachable.
To move it, change the variable and restart — no code change.

- Add, edit, delete projects in English and Arabic side by side.
- Publish / unpublish, feature on the home page, and reorder with the arrows.
- Choose the artwork: a **generated** visual built from the project's flow steps and stack, an uploaded **cover image**,
  or one of the three original illustrations.
- **Inbox** for contact-form briefs, with unread count and reply-by-email.

Sign-in uses the `ADMIN_PASSWORD` environment variable (use a long random one, 20+ characters).
If it is not set, the admin stays locked.

## Security

Reviewed against the OWASP Top 10 and tested against the production build.

- **Access control** — every admin page and every admin action checks the session on the server; calling an
  action directly without a session is redirected to sign-in. Draft projects are invisible to the public.
- **Login** — constant-time password check; 5 wrong passwords from one IP in 15 minutes locks that IP out for
  15 minutes. Sessions are signed (HMAC-SHA256), `HttpOnly`, `Secure`, `SameSite=Lax`, 7-day expiry.
  **Signing out revokes every session on every device.**
- **Injection / XSS** — all SQL is parameterised; React escapes all content; project links accept only `http(s)`.
- **Uploads** — images are identified by their bytes (JPG, PNG, WebP, GIF, AVIF only; SVG rejected) and served
  with `nosniff` and a sandboxing CSP.
- **Headers** — anti-framing (`frame-ancestors 'none'`, `X-Frame-Options`), `nosniff`, HSTS, referrer and
  permissions policies on every page; admin responses are `no-store` and `noindex`.
- **Abuse** — the contact form accepts 5 briefs per IP per hour and has a spam honeypot. Only the home page
  and the admin accept POST requests, with size limits; everything else gets 405.
- **Logging** — sign-ins, failures, lockouts, sign-outs and deletions are logged with the IP as `[security]` lines.

**Client IP:** rate limits trust exactly one header, `CLIENT_IP_HEADER` (default `x-real-ip`, set by Dokploy's
Traefik). When the site moves behind Cloudflare, set `CLIENT_IP_HEADER=cf-connecting-ip` and only allow traffic
from Cloudflare to reach the server — otherwise the header can be forged.

**Known limitation:** production runs on `wrangler dev`, which is not hardened for hostile traffic. The app shields it
(request filtering, reading every request body) and `npm run start` restarts it automatically if it ever stops, but
deploying to Cloudflare Workers is the long-term fix.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
cp .dev.vars.example .dev.vars   # then set ADMIN_PATH and ADMIN_PASSWORD
npm run dev
```

On first run the database is created and filled with the original portfolio projects.
Local data is stored in `.wrangler/state`.

## Production build

```bash
npm ci
npm run build
ADMIN_PATH=... ADMIN_PASSWORD=... npm run start
```

The server listens on port `3000` (override with `PORT`) and binds to `0.0.0.0`.
Database and uploaded images are stored in `DATA_DIR` (default `.data`).

## Dokploy

1. Create an application from this repository and select Dockerfile as the build type. Container port: `3000`.
2. Add environment variables: `ADMIN_PATH` and `ADMIN_PASSWORD` (both required for admin); optionally
   `SESSION_SECRET` and `CLIENT_IP_HEADER` (see Security).
3. **Add a volume mount at `/app/data`.** Without it, projects added in the admin and uploaded images are lost on every redeploy.
