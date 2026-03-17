# Architecture

## Product split
- `Purrify Music` uses a split architecture because the web app cannot directly control YouTube Music playback.
- The Chrome extension owns real-time detection and skip/prompt behavior on `music.youtube.com`.
- The web app owns onboarding, pricing, billing, blocklist management, analytics, and support pages.

## Runtime responsibilities
### Extension
- Reads track metadata from the player bar.
- Normalizes artist and song metadata.
- Evaluates enabled blocklist items locally.
- Triggers autoskip or prompt mode.
- Logs playback events for later analytics.

### Web app
- Presents the marketing site and pricing.
- Manages blocklists and plan limits.
- Surfaces listening analytics and event history.
- Accepts event ingestion from the extension.

### Backend
- Supabase Auth handles Google sign-in.
- Postgres stores entitlements, blocklists, blocklist items, and playback events.
- Stripe webhooks drive plan status changes.

## MVP defaults
- Chrome-only.
- English-first.
- Autoskip is primary; prompt mode exists as a safety fallback.
- Manual rule entry uses exact text plus suggestions from already-seen listening history.
- Artist rules use a single artist field.
- Song rules use separate song-title and artist fields so duplicate song names can still be matched precisely.
