# Memora Legal

Static legal pages for Memora AI, built with React + Vite + TypeScript. Hosts the Privacy Policy, Terms of Service, and Account Deletion page for linking from the mobile app and app store listings.

## Pages

| Route | Description |
|-------|-------------|
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/account-deletion` | Account Deletion Request (Google Play requirement) |

Visiting `/` redirects to `/privacy`.

## Local development

```bash
cd memora-legal
npm install
npm run dev
```

Open [http://localhost:5173/privacy](http://localhost:5173/privacy), [http://localhost:5173/terms](http://localhost:5173/terms), or [http://localhost:5173/account-deletion](http://localhost:5173/account-deletion).

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Deploy to Vercel

This project is a client-side SPA. Vercel serves static files from `dist/` and uses `vercel.json` rewrites so `/privacy`, `/terms`, and `/account-deletion` work on direct navigation and refresh.

### Option A — Vercel Dashboard

1. Push this repo to GitHub (or connect your existing repo).
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. Set **Root Directory** to `memora-legal`.
4. Framework preset: **Vite** (auto-detected).
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy.

### Option B — Vercel CLI

```bash
cd memora-legal
npm install -g vercel
vercel
```

Follow prompts. For production:

```bash
vercel --prod
```

### Placeholder URLs

After deployment, your legal pages will be available at:

- `https://your-domain.vercel.app/privacy`
- `https://your-domain.vercel.app/terms`
- `https://your-domain.vercel.app/account-deletion`

Replace `your-domain` with your Vercel project domain or custom domain (e.g. `legal.memora.app`).

Configure these URLs in the mobile app:

```env
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.vercel.app/privacy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-domain.vercel.app/terms
```

## Mobile integration

The Memora mobile app Profile screen opens these URLs in the device browser via `Linking.openURL()`. Set the `EXPO_PUBLIC_*` variables in `mobile/.env` (local) or EAS Secrets (production builds).

See `docs/ENVIRONMENT_VARIABLES.md` in the repo root for full configuration details.

## Project structure

```
memora-legal/
├── public/           # Static assets (favicon)
├── src/
│   ├── components/   # Layout and legal document renderer
│   ├── content/    # Shared legal copy
│   └── pages/      # Privacy, Terms, and Account Deletion routes
├── package.json
├── vite.config.ts
├── vercel.json       # SPA rewrites for Vercel
└── README.md
```

## Notes

- No backend or API — fully static, free-tier friendly.
- Legal copy is also mirrored in `docs/privacy-policy.md` and `docs/terms-of-service.md` at the repo root.
