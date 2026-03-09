# Policy Risk Notes

## Current stance
- Autoskip is technically feasible through a Chrome extension that reads the YouTube Music page and triggers the player UI.
- This does not create a guaranteed-safe policy posture.
- Purrify should launch with minimal permissions, clear user-controlled messaging, and a prompt-mode fallback.

## Product safeguards
- Ask only for access to `https://music.youtube.com/*`.
- Avoid broad browser history or tab permissions.
- Keep the extension copy explicit that it is an independent companion tool.
- Include a runtime setting that downgrades from autoskip to prompt mode if selectors become unreliable.

## Go / no-go check before public launch
- Selector reliability on playlists, queues, and radios.
- No hidden dependency on unsupported APIs.
- Chrome Web Store listing copy reviewed to avoid implying official affiliation.
