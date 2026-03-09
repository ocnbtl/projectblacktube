const TITLE_SELECTORS = [
  "ytmusic-player-bar .title",
  "ytmusic-player-bar #song-title",
  "ytmusic-player-bar .content-info-wrapper .title"
];

const ARTIST_LINK_SELECTOR = "ytmusic-player-bar .byline a";
const ARTIST_TEXT_SELECTORS = [
  "ytmusic-player-bar .byline",
  "ytmusic-player-bar .subtitle",
  "ytmusic-player-bar .content-info-wrapper .byline"
];

const NEXT_BUTTON_SELECTORS = [
  "ytmusic-player-bar tp-yt-paper-icon-button.next-button",
  "ytmusic-player-bar .next-button",
  "tp-yt-paper-icon-button[title*='Next']",
  "tp-yt-paper-icon-button[aria-label*='Next']"
];

let state = {
  mode: "autoskip",
  blocklists: [],
  items: []
};

let lastTrackKey = "";
let lastActionAt = 0;
let scanTimer = null;

function normalizeText(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArtist(value) {
  const primaryArtist = value.split(/[•,]/)[0] ?? value;
  return normalizeText(primaryArtist.replace(/\b(feat|featuring|ft)\b.*$/i, ""));
}

function normalizeSongKey(title, artist) {
  return `${normalizeText(title)}::${normalizeArtist(artist)}`;
}

function getEnabledBlocklistIds(blocklists) {
  return new Set(blocklists.filter((blocklist) => blocklist.enabled).map((blocklist) => blocklist.id));
}

function matchTrack(track) {
  const enabledIds = getEnabledBlocklistIds(state.blocklists);
  const artistKey = normalizeArtist(track.artist);
  const songKey = normalizeSongKey(track.title, track.artist);

  return (
    state.items.find((item) => {
      if (!enabledIds.has(item.blocklistId)) {
        return false;
      }

      if (item.type === "artist") {
        return item.normalizedValue === artistKey;
      }

      return item.normalizedValue === songKey;
    }) ?? null
  );
}

function textFromSelectors(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.textContent?.trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function readArtist() {
  const artistLinks = [...document.querySelectorAll(ARTIST_LINK_SELECTOR)];
  if (artistLinks.length > 0) {
    const firstArtist = artistLinks[0]?.textContent?.trim();
    if (firstArtist) {
      return firstArtist;
    }
  }

  const text = textFromSelectors(ARTIST_TEXT_SELECTORS);
  return text.split("•")[0]?.trim() ?? "";
}

function readCurrentTrack() {
  const title = textFromSelectors(TITLE_SELECTORS);
  const artist = readArtist();

  if (!title || !artist) {
    return null;
  }

  return { title, artist };
}

function findNextButton() {
  for (const selector of NEXT_BUTTON_SELECTORS) {
    const button = document.querySelector(selector);
    if (button instanceof HTMLElement) {
      return button;
    }
  }

  return null;
}

function removePrompt() {
  document.getElementById("purrify-banner")?.remove();
}

function showBanner(message, actionLabel, onAction) {
  removePrompt();

  const banner = document.createElement("div");
  banner.id = "purrify-banner";
  banner.style.cssText = [
    "position:fixed",
    "right:20px",
    "bottom:20px",
    "width:min(360px, calc(100vw - 32px))",
    "padding:16px",
    "border-radius:20px",
    "background:rgba(23,31,27,0.94)",
    "color:#f6f3eb",
    "box-shadow:0 24px 60px rgba(0,0,0,0.28)",
    "z-index:2147483647",
    "font-family:system-ui,sans-serif"
  ].join(";");

  const text = document.createElement("p");
  text.textContent = message;
  text.style.margin = "0 0 12px";

  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:10px;flex-wrap:wrap";

  const primary = document.createElement("button");
  primary.textContent = actionLabel;
  primary.style.cssText =
    "border:0;border-radius:999px;padding:10px 14px;background:#d7b26b;color:#1a201c;font-weight:700;cursor:pointer";
  primary.addEventListener("click", () => {
    onAction();
    removePrompt();
  });

  const dismiss = document.createElement("button");
  dismiss.textContent = "Dismiss";
  dismiss.style.cssText =
    "border:1px solid rgba(255,255,255,0.18);border-radius:999px;padding:10px 14px;background:transparent;color:#f6f3eb;cursor:pointer";
  dismiss.addEventListener("click", removePrompt);

  row.append(primary, dismiss);
  banner.append(text, row);
  document.body.append(banner);
}

function clickNextButton() {
  const now = Date.now();
  if (now - lastActionAt < 900) {
    return true;
  }

  const button = findNextButton();
  if (!button) {
    return false;
  }

  button.click();
  lastActionAt = now;
  return true;
}

function logEvent(track, action, matchedItemId, reason) {
  chrome.runtime.sendMessage({
    type: "LOG_EVENT",
    event: {
      title: track.title,
      artist: track.artist,
      normalizedTitle: normalizeText(track.title),
      normalizedArtist: normalizeArtist(track.artist),
      action,
      matchedItemId,
      metadata: {
        reason
      }
    }
  });
}

function evaluateTrack(reason) {
  const track = readCurrentTrack();
  if (!track) {
    return;
  }

  const currentKey = normalizeSongKey(track.title, track.artist);
  if (reason !== "state" && currentKey === lastTrackKey) {
    return;
  }

  lastTrackKey = currentKey;
  const matchedItem = matchTrack(track);

  if (!matchedItem) {
    removePrompt();
    logEvent(track, "played", null, reason);
    return;
  }

  if (state.mode === "autoskip" && clickNextButton()) {
    showBanner(`Skipped blocked ${matchedItem.type}: ${matchedItem.displayValue}`, "Switch to prompt mode", () => {
      state.mode = "prompt";
      chrome.runtime.sendMessage({ type: "SET_MODE", mode: "prompt" });
    });
    logEvent(track, "skipped", matchedItem.id, reason);
    return;
  }

  showBanner(
    `Blocked ${matchedItem.type} detected: ${matchedItem.displayValue}`,
    "Skip blocked track",
    () => {
      const skipped = clickNextButton();
      logEvent(track, skipped ? "skipped" : "prompted", matchedItem.id, "prompt-action");
    }
  );
  logEvent(track, "prompted", matchedItem.id, reason);
}

function scheduleEvaluation(reason) {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => evaluateTrack(reason), 180);
}

async function refreshState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (response?.ok) {
    state = response.state;
    scheduleEvaluation("state");
  }
}

function startObservers() {
  const observer = new MutationObserver(() => scheduleEvaluation("mutation"));
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true
  });

  window.setInterval(() => scheduleEvaluation("interval"), 2000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      scheduleEvaluation("visibility");
    }
  });
  window.addEventListener("focus", () => scheduleEvaluation("focus"));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_CURRENT_TRACK") {
    sendResponse({ ok: true, track: readCurrentTrack() });
    return true;
  }

  if (message.type === "STATE_UPDATED") {
    refreshState().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

refreshState();
startObservers();
