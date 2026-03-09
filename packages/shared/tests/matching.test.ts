import test from "node:test";
import assert from "node:assert/strict";

import { getEnabledBlocklistIds, makeArtistItemValue, makeSongItemValue, matchTrackAgainstItems } from "../src/matching.ts";
import { normalizeArtist, normalizeSongKey, normalizeText } from "../src/normalization.ts";
import { sampleBlocklists, sampleItems } from "../src/sample-data.ts";

test("normalizeText strips punctuation, case, and accents", () => {
  assert.equal(normalizeText("Beyoncé & Jay-Z"), "beyonce and jay z");
});

test("normalizeArtist collapses featuring and separators", () => {
  assert.equal(normalizeArtist("Rosalía feat. Rauw Alejandro"), "rosalia");
  assert.equal(normalizeArtist("Mia North, Guest"), "mia north");
});

test("normalizeSongKey combines title and primary artist", () => {
  assert.equal(normalizeSongKey("Replay Again", "Mia North"), "replay again::mia north");
});

test("matches an artist rule from an enabled blocklist", () => {
  const match = matchTrackAgainstItems(
    {
      title: "New Song",
      artist: "Luke Faux"
    },
    sampleItems,
    getEnabledBlocklistIds(sampleBlocklists)
  );

  assert.ok(match);
  assert.equal(match.item.type, "artist");
  assert.equal(match.item.normalizedValue, makeArtistItemValue("Luke Faux"));
});

test("matches a song rule from an enabled blocklist", () => {
  const match = matchTrackAgainstItems(
    {
      title: "Replay Again",
      artist: "Mia North"
    },
    sampleItems,
    getEnabledBlocklistIds(sampleBlocklists)
  );

  assert.ok(match);
  assert.equal(match.item.type, "song");
  assert.equal(match.item.normalizedValue, makeSongItemValue({ title: "Replay Again", artist: "Mia North" }));
});

test("does not match items from disabled blocklists", () => {
  const disabledItems = [
    {
      id: "item-disabled",
      blocklistId: "list-spanish",
      type: "artist" as const,
      displayValue: "Rosaline",
      normalizedValue: makeArtistItemValue("Rosaline"),
      source: "manual" as const
    }
  ];

  const match = matchTrackAgainstItems(
    {
      title: "Desert Hearts",
      artist: "Rosaline"
    },
    disabledItems,
    getEnabledBlocklistIds(sampleBlocklists)
  );

  assert.equal(match, null);
});
