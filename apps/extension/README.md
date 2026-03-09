# Extension Spike

This folder is a loadable Chrome MV3 extension with no build step.

## Load locally
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select [`apps/extension`](/Users/ocean/Documents/Project%20Blacktube/apps/extension)
5. Open `https://music.youtube.com`

## What it currently does
- Detects the current track title and artist from the player bar.
- Matches the track against local artist and song rules.
- Triggers autoskip or shows a prompt banner, depending on mode.
- Lets you add the current song or artist from the popup.
- Stores blocklists and events in local extension storage.

## Known limits
- This is a local-first spike; it does not sync with Supabase yet.
- Selectors may need adjustment against real YouTube Music DOM changes.
- The prompt fallback is intentionally simple and should later move to dashboard-driven settings.

