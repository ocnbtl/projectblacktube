export const STORAGE_KEY = "purrifyState";

export const DEFAULT_STATE = {
  mode: "autoskip",
  plan: "free",
  blocklists: [
    {
      id: "default-blocklist",
      name: "General",
      enabled: true,
      sortOrder: 0
    }
  ],
  items: [],
  events: []
};

export function normalizeText(value) {
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

export function normalizeArtist(value) {
  const primaryArtist = value.split(/[•,]/)[0] ?? value;
  return normalizeText(primaryArtist.replace(/\b(feat|featuring|ft)\b.*$/i, ""));
}

export function normalizeSongKey(title, artist) {
  return `${normalizeText(title)}::${normalizeArtist(artist)}`;
}

export function getEnabledBlocklistIds(blocklists) {
  return new Set(blocklists.filter((blocklist) => blocklist.enabled).map((blocklist) => blocklist.id));
}

export function matchTrack(track, state) {
  const enabledIds = getEnabledBlocklistIds(state.blocklists);
  const songKey = normalizeSongKey(track.title, track.artist);
  const artistKey = normalizeArtist(track.artist);

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

export function buildSongDisplay(track) {
  return `${track.title} - ${track.artist}`;
}

export function makeItem(type, displayValue, blocklistId) {
  const normalizedValue =
    type === "artist"
      ? normalizeArtist(displayValue)
      : normalizeSongKey(...displayValue.split(" - ").map((part) => part.trim()));

  return {
    id: crypto.randomUUID(),
    blocklistId,
    type,
    displayValue,
    normalizedValue,
    source: "manual"
  };
}

