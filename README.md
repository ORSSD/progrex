# Progrex Portfolio

The bilingual Progrex technology studio portfolio (English and Arabic/RTL), built with React, Vinext, Vite, and Tailwind CSS.

Projects, labs and contact-form messages live in a database and are managed from a password-protected
admin dashboard at `/admin` — no code changes or redeploys needed to add work.

## What's in the site

- **Home** — hero, approach, featured work, capabilities (with live project counts), labs, studio principles, contact.
- **/work** — every published project, filterable by discipline (Build / Intelligence / Secure) or Labs.
- **/work/[slug]** — case study page generated from the project's data: question, what we built, system flow,
  outcomes, stack, links, and a "next project" link.
- **Contact form** — saves briefs to the database; read them in the admin Inbox.
- **English / Arabic** — the header toggle switches language (remembered in a cookie). Arabic uses IBM Plex Sans Arabic
  and a full right-to-left layout. Any Arabic field left empty falls back to English.
- `sitemap.xml` and `robots.txt` are generated from the published projects.

## Admin (`/admin`)

- Add, edit, delete projects in English and Arabic side by side.
- Publish / unpublish, feature on the home page, and reorder with the arrows.
- Choose the artwork: a **generated** visual built from the project's flow steps and stack, an uploaded **cover image**,
  or one of the three original illustrations.
- **Inbox** for contact-form briefs, with unread count and reply-by-email.

Sign-in uses the `ADMIN_PASSWORD` environment variable. If it is not set, the admin stays locked.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
cp .dev.vars.example .dev.vars   # then set ADMIN_PASSWORD
npm run dev
```

On first run the database is created and filled with the original portfolio projects.
Local data is stored in `.wrangler/state`.

## Production build

```bash
npm ci
npm run build
ADMIN_PASSWORD=... npm run start
```

The server listens on port `3000` (override with `PORT`) and binds to `0.0.0.0`.
Database and uploaded images are stored in `DATA_DIR` (default `.data`).

## Dokploy

1. Create an application from this repository and select Dockerfile as the build type. Container port: `3000`.
2. Add environment variables: `ADMIN_PASSWORD` (required for admin) and optionally `SESSION_SECRET`.
3. **Add a volume mount at `/app/data`.** Without it, projects added in the admin and uploaded images are lost on every redeploy.
