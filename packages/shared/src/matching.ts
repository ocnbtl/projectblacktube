import { normalizeArtist, normalizeSongKey, normalizeTrack } from "./normalization.ts";
import type { Blocklist, BlocklistItem, MatchedRule, PlaybackEvent, TrackSnapshot } from "./types.ts";

export function getEnabledBlocklistIds(blocklists: Blocklist[]): Set<string> {
  return new Set(blocklists.filter((blocklist) => blocklist.enabled).map((blocklist) => blocklist.id));
}

export function matchTrackAgainstItems(
  track: TrackSnapshot,
  items: BlocklistItem[],
  enabledBlocklistIds?: Set<string>
): MatchedRule | null {
  const normalizedTrack = normalizeTrack(track);

  for (const item of items) {
    if (enabledBlocklistIds && !enabledBlocklistIds.has(item.blocklistId)) {
      continue;
    }

    if (item.type === "artist" && item.normalizedValue === normalizedTrack.normalizedArtist) {
      return {
        item,
        normalizedTrackKey: normalizedTrack.normalizedSongKey
      };
    }

    if (
      item.type === "song" &&
      item.normalizedValue === normalizeSongKey(track.title, track.artist)
    ) {
      return {
        item,
        normalizedTrackKey: normalizedTrack.normalizedSongKey
      };
    }
  }

  return null;
}

export function makeArtistItemValue(artist: string): string {
  return normalizeArtist(artist);
}

export function makeSongItemValue(track: TrackSnapshot): string {
  return normalizeSongKey(track.title, track.artist);
}

export function buildHistorySuggestions(events: PlaybackEvent[], limit = 8): TrackSnapshot[] {
  const seen = new Set<string>();
  const suggestions: TrackSnapshot[] = [];

  for (const event of events) {
    const key = `${event.normalizedTitle}::${event.normalizedArtist}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    suggestions.push({
      title: event.title,
      artist: event.artist
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
}
