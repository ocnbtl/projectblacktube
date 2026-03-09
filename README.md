# Project Blacktube

Internal codename for the Purrify Music MVP.

## What is in this repository
- `apps/web`: Next.js marketing site and product dashboard scaffold.
- `apps/extension`: Chrome MV3 extension spike for live YouTube Music detection, autoskip, and prompt mode.
- `packages/shared`: shared plan limits, types, normalization, and matching logic.
- `supabase`: schema and policies for auth, entitlements, blocklists, and playback events.
- `docs`: architecture and launch notes.

See [`docs/launch-setup-checklist.md`](/Users/ocean/Documents/Project%20Blacktube/docs/launch-setup-checklist.md) for the production setup order across GitHub, Vercel, Cloudflare, Supabase, Google OAuth, Stripe, and the extension.

## Current implementation state
- The extension is loadable as an unpacked Chrome extension without a build step.
- The web app is scaffolded and ready for dependency install plus environment wiring.
- Shared business logic is implemented with tests using the Node test runner.
- Supabase schema, RLS policies, and analytics views are defined.

## Local setup
1. Install `pnpm` via Corepack:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy `.env.example` to `.env.local` and fill the Supabase and Stripe values.
4. Start the web app:

```bash
pnpm dev:web
```

5. Load the extension in Chrome:
- Open `chrome://extensions`
- Enable Developer mode
- Click `Load unpacked`
- Select [`apps/extension`](/Users/ocean/Documents/Project%20Blacktube/apps/extension)

## Immediate next steps
- Connect the web dashboard to a live Supabase project.
- Add Stripe webhook secrets and verify entitlement sync.
- Load the extension against `music.youtube.com` and verify selectors on real playback flows.
- Replace demo data in the web app with authenticated queries and mutations.
