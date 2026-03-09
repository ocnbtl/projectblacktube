"use client";

import { useState } from "react";

import {
  canAddItemToBlocklist,
  canCreateBlocklist,
  getEnabledBlocklistIds,
  makeArtistItemValue,
  makeSongItemValue,
  matchTrackAgainstItems,
  type BlockItemType,
  type Blocklist,
  type BlocklistItem,
  type TrackSnapshot
} from "@blacktube/shared";

import { dashboardSeed, demoCurrentTracks } from "@/lib/demo-data";

function parseSongEntry(value: string): TrackSnapshot | null {
  const parts = value.split(" - ").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return {
    title: parts[0],
    artist: parts.slice(1).join(" - ")
  };
}

export function DashboardDemo() {
  const [blocklists, setBlocklists] = useState<Blocklist[]>(dashboardSeed.blocklists);
  const [items, setItems] = useState<BlocklistItem[]>(dashboardSeed.items);
  const [currentTrack, setCurrentTrack] = useState<TrackSnapshot>(demoCurrentTracks[0]);
  const [selectedListId, setSelectedListId] = useState(blocklists[0]?.id ?? "");
  const [entryType, setEntryType] = useState<BlockItemType>("artist");
  const [entryValue, setEntryValue] = useState("");
  const [notice, setNotice] = useState("Autoskip is active for enabled blocklists.");

  const enabledIds = getEnabledBlocklistIds(blocklists);
  const match = matchTrackAgainstItems(currentTrack, items, enabledIds);
  const selectedList = blocklists.find((blocklist) => blocklist.id === selectedListId) ?? blocklists[0];
  const itemsInSelectedList = items.filter((item) => item.blocklistId === selectedList?.id);

  function toggleBlocklist(id: string) {
    setBlocklists((current) =>
      current.map((blocklist) =>
        blocklist.id === id ? { ...blocklist, enabled: !blocklist.enabled } : blocklist
      )
    );
  }

  function addManualItem() {
    if (!selectedList) {
      setNotice("Create or select a blocklist first.");
      return;
    }

    if (!canAddItemToBlocklist(dashboardSeed.entitlement, itemsInSelectedList.length)) {
      setNotice("This plan has reached its per-blocklist limit.");
      return;
    }

    if (!entryValue.trim()) {
      setNotice("Enter an artist or `Song Title - Artist Name`.");
      return;
    }

    let displayValue = entryValue.trim();
    let normalizedValue = "";

    if (entryType === "artist") {
      normalizedValue = makeArtistItemValue(displayValue);
    } else {
      const parsed = parseSongEntry(entryValue);
      if (!parsed) {
        setNotice("Song rules must use `Song Title - Artist Name`.");
        return;
      }

      displayValue = `${parsed.title} - ${parsed.artist}`;
      normalizedValue = makeSongItemValue(parsed);
    }

    setItems((current) => [
      {
        id: crypto.randomUUID(),
        blocklistId: selectedList.id,
        type: entryType,
        displayValue,
        normalizedValue,
        source: "manual"
      },
      ...current
    ]);
    setEntryValue("");
    setNotice(`Added ${entryType} rule to ${selectedList.name}.`);
  }

  function quickAdd(kind: BlockItemType) {
    if (!selectedList) {
      setNotice("Create or select a blocklist first.");
      return;
    }

    if (!canAddItemToBlocklist(dashboardSeed.entitlement, itemsInSelectedList.length)) {
      setNotice("Upgrade to add more items to this blocklist.");
      return;
    }

    const displayValue =
      kind === "artist" ? currentTrack.artist : `${currentTrack.title} - ${currentTrack.artist}`;
    const normalizedValue =
      kind === "artist" ? makeArtistItemValue(currentTrack.artist) : makeSongItemValue(currentTrack);

    setItems((current) => [
      {
        id: crypto.randomUUID(),
        blocklistId: selectedList.id,
        type: kind,
        displayValue,
        normalizedValue,
        source: "current_track"
      },
      ...current
    ]);

    setNotice(`Saved the current ${kind} to ${selectedList.name}.`);
  }

  function createBlocklist() {
    if (!canCreateBlocklist(dashboardSeed.entitlement, blocklists.length)) {
      setNotice("Your current plan cannot create another blocklist.");
      return;
    }

    const name = `New blocklist ${blocklists.length + 1}`;
    const next: Blocklist = {
      id: crypto.randomUUID(),
      name,
      enabled: true,
      sortOrder: blocklists.length
    };

    setBlocklists((current) => [...current, next]);
    setSelectedListId(next.id);
    setNotice(`Created ${name}.`);
  }

  return (
    <div className="dashboard-grid">
      <section className="panel spotlight">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Live status</p>
            <h2>Current playback match preview</h2>
          </div>
          <span className={`status-chip ${match ? "warn" : "ok"}`}>
            {match ? "Blocked track detected" : "Clear to play"}
          </span>
        </div>

        <div className="current-track">
          <div>
            <p className="muted">Now playing</p>
            <strong>{currentTrack.title}</strong>
            <p>{currentTrack.artist}</p>
          </div>
          <div className="button-row">
            {demoCurrentTracks.map((track) => (
              <button
                key={`${track.title}-${track.artist}`}
                className="ghost-button"
                onClick={() => setCurrentTrack(track)}
                type="button"
              >
                {track.title}
              </button>
            ))}
          </div>
        </div>

        <p className="notice-line">
          {match
            ? `This track would trigger ${match.item.type === "artist" ? "an artist" : "a song"} block and skip immediately.`
            : "No active rule matches this track right now."}
        </p>

        <div className="button-row">
          <button className="primary-button" onClick={() => quickAdd("song")} type="button">
            Block current song
          </button>
          <button className="secondary-button" onClick={() => quickAdd("artist")} type="button">
            Block current artist
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Blocklists</p>
            <h2>Toggle listening modes</h2>
          </div>
          <button className="ghost-button" onClick={createBlocklist} type="button">
            New blocklist
          </button>
        </div>

        <div className="stack-list">
          {blocklists.map((blocklist) => {
            const itemCount = items.filter((item) => item.blocklistId === blocklist.id).length;
            return (
              <button
                key={blocklist.id}
                className={`list-row ${blocklist.id === selectedListId ? "selected" : ""}`}
                onClick={() => setSelectedListId(blocklist.id)}
                type="button"
              >
                <div>
                  <strong>{blocklist.name}</strong>
                  <p className="muted">{itemCount} rules</p>
                </div>
                <label className="toggle">
                  <input
                    checked={blocklist.enabled}
                    onChange={() => toggleBlocklist(blocklist.id)}
                    type="checkbox"
                  />
                  <span>{blocklist.enabled ? "On" : "Off"}</span>
                </label>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Manual add</p>
            <h2>Exact text rules</h2>
          </div>
          <span className="muted">
            {itemsInSelectedList.length}/{dashboardSeed.entitlement.itemsPerBlocklistLimit ?? "∞"} used
          </span>
        </div>

        <div className="form-grid">
          <label>
            <span>Blocklist</span>
            <select value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)}>
              {blocklists.map((blocklist) => (
                <option key={blocklist.id} value={blocklist.id}>
                  {blocklist.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type</span>
            <select value={entryType} onChange={(event) => setEntryType(event.target.value as BlockItemType)}>
              <option value="artist">Artist</option>
              <option value="song">Song</option>
            </select>
          </label>
        </div>

        <label>
          <span>{entryType === "artist" ? "Artist name" : "Song Title - Artist Name"}</span>
          <input
            onChange={(event) => setEntryValue(event.target.value)}
            placeholder={entryType === "artist" ? "Luke Faux" : "Replay Again - Mia North"}
            value={entryValue}
          />
        </label>

        <button className="primary-button" onClick={addManualItem} type="button">
          Add rule
        </button>
        <p className="notice-line">{notice}</p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Suggestions</p>
            <h2>Seen from listening history</h2>
          </div>
        </div>
        <div className="pill-grid">
          {dashboardSeed.suggestions.map((suggestion) => (
            <button
              key={`${suggestion.title}-${suggestion.artist}`}
              className="pill-button"
              onClick={() => setEntryValue(`${suggestion.title} - ${suggestion.artist}`)}
              type="button"
            >
              {suggestion.title} <span>{suggestion.artist}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

