import { buildSongDisplay, DEFAULT_STATE, normalizeArtist, normalizeSongKey, STORAGE_KEY } from "./lib.js";

async function getState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...DEFAULT_STATE,
    ...stored[STORAGE_KEY],
    blocklists: stored[STORAGE_KEY]?.blocklists ?? DEFAULT_STATE.blocklists,
    items: stored[STORAGE_KEY]?.items ?? DEFAULT_STATE.items,
    events: stored[STORAGE_KEY]?.events ?? DEFAULT_STATE.events
  };
}

async function setState(nextState) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: nextState
  });
}

async function updateState(mutator) {
  const current = await getState();
  const next = mutator(current);
  await setState(next);
  return next;
}

async function notifyStateUpdated() {
  const tabs = await chrome.tabs.query({ url: "https://music.youtube.com/*" });
  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id) {
        return;
      }

      try {
        await chrome.tabs.sendMessage(tab.id, { type: "STATE_UPDATED" });
      } catch {
        // Content script might not be ready; ignore.
      }
    })
  );
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await setState(DEFAULT_STATE);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }));

  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case "GET_STATE":
      return { ok: true, state: await getState() };

    case "SET_MODE": {
      const next = await updateState((current) => ({
        ...current,
        mode: message.mode === "prompt" ? "prompt" : "autoskip"
      }));
      await notifyStateUpdated();
      return { ok: true, state: next };
    }

    case "TOGGLE_BLOCKLIST": {
      const next = await updateState((current) => ({
        ...current,
        blocklists: current.blocklists.map((blocklist) =>
          blocklist.id === message.blocklistId
            ? { ...blocklist, enabled: !blocklist.enabled }
            : blocklist
        )
      }));
      await notifyStateUpdated();
      return { ok: true, state: next };
    }

    case "ADD_CURRENT_TRACK": {
      const track = message.track;
      if (!track?.title || !track?.artist) {
        return { ok: false, error: "Missing track metadata." };
      }

      const blocklistId = message.blocklistId ?? DEFAULT_STATE.blocklists[0].id;
      const displayValue =
        message.kind === "artist" ? track.artist : buildSongDisplay(track);
      const normalizedValue =
        message.kind === "artist"
          ? normalizeArtist(track.artist)
          : normalizeSongKey(track.title, track.artist);

      const next = await updateState((current) => ({
        ...current,
        items: [
          {
            id: crypto.randomUUID(),
            blocklistId,
            type: message.kind,
            displayValue,
            normalizedValue,
            source: "current_track"
          },
          ...current.items
        ]
      }));

      await notifyStateUpdated();
      return { ok: true, state: next };
    }

    case "ADD_MANUAL_RULE": {
      const blocklistId = message.blocklistId ?? DEFAULT_STATE.blocklists[0].id;
      const value = String(message.value ?? "").trim();
      const type = message.kind === "song" ? "song" : "artist";

      if (!value) {
        return { ok: false, error: "Value is required." };
      }

      if (type === "song" && !value.includes(" - ")) {
        return { ok: false, error: "Song rules must use `Song Title - Artist Name`." };
      }

      const normalizedValue =
        type === "artist"
          ? normalizeArtist(value)
          : normalizeSongKey(...value.split(" - ").map((part) => part.trim()));

      const next = await updateState((current) => ({
        ...current,
        items: [
          {
            id: crypto.randomUUID(),
            blocklistId,
            type,
            displayValue: value,
            normalizedValue,
            source: "manual"
          },
          ...current.items
        ]
      }));

      await notifyStateUpdated();
      return { ok: true, state: next };
    }

    case "ADD_BLOCKLIST": {
      const name = String(message.name ?? "").trim() || `New blocklist`;
      const next = await updateState((current) => ({
        ...current,
        blocklists: [
          ...current.blocklists,
          {
            id: crypto.randomUUID(),
            name,
            enabled: true,
            sortOrder: current.blocklists.length
          }
        ]
      }));
      await notifyStateUpdated();
      return { ok: true, state: next };
    }

    case "LOG_EVENT": {
      const state = await updateState((current) => ({
        ...current,
        events: [
          {
            id: crypto.randomUUID(),
            seenAt: new Date().toISOString(),
            ...message.event
          },
          ...current.events
        ].slice(0, 200)
      }));
      return { ok: true, state };
    }

    case "CLEAR_EVENTS": {
      const next = await updateState((current) => ({
        ...current,
        events: []
      }));
      return { ok: true, state: next };
    }

    case "SYNC_PREVIEW":
      return {
        ok: true,
        note: "Supabase sync is not wired yet.",
        sender: sender.tab?.url ?? "extension"
      };

    default:
      return { ok: false, error: `Unknown message type: ${message.type}` };
  }
}

