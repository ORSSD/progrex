# Progrex Portfolio

The bilingual Progrex technology studio portfolio (English and Arabic/RTL), built with React, Vinext, Vite, and Tailwind CSS.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

## Production build

```bash
npm ci
npm run build
npm run start
```

The production server listens on port `3000` and binds to `0.0.0.0` for container hosting.

## Dokploy

Create an application from this repository and select Dockerfile as the build type. Set the container port to `3000`; no application secrets are required for the current version.
