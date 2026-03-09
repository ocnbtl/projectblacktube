import { makeEntitlement } from "./plans.ts";
import { makeArtistItemValue, makeSongItemValue } from "./matching.ts";
import { normalizeArtist, normalizeTitle } from "./normalization.ts";
import type { AnalyticsSnapshot, Blocklist, BlocklistItem, PlaybackEvent, TrackSnapshot } from "./types.ts";

export const sampleEntitlement = makeEntitlement("cheap");

export const sampleBlocklists: Blocklist[] = [
  {
    id: "list-country",
    name: "Country blocklist",
    enabled: true,
    sortOrder: 0
  },
  {
    id: "list-spanish",
    name: "Spanish mood off",
    enabled: false,
    sortOrder: 1
  },
  {
    id: "list-repeat",
    name: "Overplayed skips",
    enabled: true,
    sortOrder: 2
  }
];

const artistTrack: TrackSnapshot = {
  title: "Anything but Country",
  artist: "Luke Faux"
};

const songTrack: TrackSnapshot = {
  title: "Replay Again",
  artist: "Mia North"
};

export const sampleItems: BlocklistItem[] = [
  {
    id: "item-artist",
    blocklistId: "list-country",
    type: "artist",
    displayValue: artistTrack.artist,
    normalizedValue: makeArtistItemValue(artistTrack.artist),
    source: "manual"
  },
  {
    id: "item-song",
    blocklistId: "list-repeat",
    type: "song",
    displayValue: `${songTrack.title} - ${songTrack.artist}`,
    normalizedValue: makeSongItemValue(songTrack),
    source: "current_track"
  }
];

export const sampleEvents: PlaybackEvent[] = [
  {
    id: "evt-1",
    title: "Replay Again",
    artist: "Mia North",
    normalizedTitle: normalizeTitle("Replay Again"),
    normalizedArtist: normalizeArtist("Mia North"),
    seenAt: "2026-03-09T10:15:00.000Z",
    action: "skipped",
    matchedItemId: "item-song"
  },
  {
    id: "evt-2",
    title: "Desert Hearts",
    artist: "Rosaline",
    normalizedTitle: normalizeTitle("Desert Hearts"),
    normalizedArtist: normalizeArtist("Rosaline"),
    seenAt: "2026-03-09T09:45:00.000Z",
    action: "played",
    matchedItemId: null
  },
  {
    id: "evt-3",
    title: "Anything but Country",
    artist: "Luke Faux",
    normalizedTitle: normalizeTitle("Anything but Country"),
    normalizedArtist: normalizeArtist("Luke Faux"),
    seenAt: "2026-03-08T19:11:00.000Z",
    action: "prompted",
    matchedItemId: "item-artist"
  }
];

export const sampleAnalytics: AnalyticsSnapshot = {
  tracksSeen: 182,
  skipsTriggered: 26,
  promptsTriggered: 5,
  matchedTracks: 31
};
