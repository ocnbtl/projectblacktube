# Launch Setup Checklist

This checklist assumes:
- GitHub repo: `https://github.com/ocnbtl/projectblacktube`
- Production domain: `https://purrifymusic.com`
- Primary email: `hello@purrifymusic.com`

## 1. Source control
- Push the current scaffold to `origin`.
- Protect `main` after the first successful deploy.

## 2. Vercel project
- Import `ocnbtl/projectblacktube` into Vercel.
- Set the root project to the repository root.
- Add environment variables from `.env.example`.
- Set `NEXT_PUBLIC_APP_URL=https://purrifymusic.com` in production.

## 3. Domain and DNS
- Add `purrifymusic.com` and `www.purrifymusic.com` to the Vercel project.
- Point Cloudflare DNS records to the values Vercel provides.
- Keep SSL on and confirm Vercel issues the certificate.

## 4. Supabase
- Apply `supabase/migrations/20260309120000_initial_schema.sql`.
- Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Set Supabase Auth Site URL to `https://purrifymusic.com`.
- Add redirect URLs for:
  - `https://purrifymusic.com/**`
  - `https://www.purrifymusic.com/**`
  - local development URLs
- Enable Google auth once the Google OAuth app is created.

## 5. Google OAuth
- Create a Google OAuth client for the web app.
- Add authorized JavaScript origins for:
  - `https://purrifymusic.com`
  - `https://www.purrifymusic.com`
  - local development URL
- Add the Supabase callback URL as an authorized redirect URI.
- Paste the Google client ID and secret into Supabase Auth.

## 6. Stripe
- Create the three products and prices matching the current plan matrix.
- Add the Stripe secret key, publishable key, webhook secret, and price IDs to Vercel env vars.
- Point the webhook to the production billing endpoint once implemented.

## 7. Chrome extension
- Load the extension locally and validate selectors on live YouTube Music playback.
- Decide whether autoskip remains default or prompt mode should be the safer first public setting.
- Prepare store assets, privacy policy, and support email.

## 8. Launch readiness
- Confirm sign-in, blocklist CRUD, event logging, billing, and legal pages.
- Verify production domain, Supabase auth redirects, and Stripe test purchases.
- Push the first tagged release after the extension and web app are both validated.

