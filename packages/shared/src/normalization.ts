import type { TrackSnapshot } from "./types.ts";

const FEATURING_PATTERN = /\b(feat|featuring|ft)\b.*$/i;

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeArtist(value: string): string {
  const primaryArtist = value.split(/[•,]/)[0] ?? value;
  return normalizeText(primaryArtist.replace(FEATURING_PATTERN, ""));
}

export function normalizeTitle(value: string): string {
  return normalizeText(value);
}

export function normalizeSongKey(title: string, artist: string): string {
  return `${normalizeTitle(title)}::${normalizeArtist(artist)}`;
}

export function normalizeTrack(track: TrackSnapshot): TrackSnapshot & {
  normalizedTitle: string;
  normalizedArtist: string;
  normalizedSongKey: string;
} {
  const normalizedTitle = normalizeTitle(track.title);
  const normalizedArtist = normalizeArtist(track.artist);

  return {
    ...track,
    normalizedTitle,
    normalizedArtist,
    normalizedSongKey: `${normalizedTitle}::${normalizedArtist}`
  };
}
