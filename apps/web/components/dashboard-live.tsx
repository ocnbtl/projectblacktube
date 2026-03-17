"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  canAddItemToBlocklist,
  canCreateBlocklist,
  getEnabledBlocklistIds,
  makeArtistItemValue,
  makeSongItemValue,
  matchTrackAgainstItems,
  type BlockItemType,
  type Blocklist,
  type TrackSnapshot
} from "@blacktube/shared";

import { isSupabaseConfigured } from "@/lib/env";
import { loadDashboardSnapshot, type DashboardSnapshot } from "@/lib/purrify-data";
import { getBrowserSupabaseClient, signInWithGoogle } from "@/lib/supabase-browser";

const fallbackTracks: TrackSnapshot[] = [
  {
    title: "Replay Again",
    artist: "Mia North"
  },
  {
    title: "Desert Hearts",
    artist: "Rosaline"
  },
  {
    title: "Anything but Country",
    artist: "Luke Faux"
  }
];

export function DashboardLive() {
  const supabaseReady = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState("Sign in to sync live blocklists from Supabase.");
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [selectedListId, setSelectedListId] = useState("");
  const [entryType, setEntryType] = useState<BlockItemType>("artist");
  const [artistEntryValue, setArtistEntryValue] = useState("");
  const [songTitleEntryValue, setSongTitleEntryValue] = useState("");
  const [songArtistEntryValue, setSongArtistEntryValue] = useState("");
  const [currentTrack, setCurrentTrack] = useState<TrackSnapshot>(fallbackTracks[0]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabaseReady) {
      setReady(true);
      setErrorMessage("Missing Supabase env. Add the publishable key and URL to continue.");
      return;
    }

    const supabase = getBrowserSupabaseClient();

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSession(data.session);
      }

      setReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabaseReady]);

  useEffect(() => {
    if (!session) {
      setSnapshot(null);
      return;
    }

    void refreshSnapshot(session.user.id);
  }, [session]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const activeList = snapshot.blocklists.find((blocklist) => blocklist.id === selectedListId);
    if (!activeList) {
      setSelectedListId(snapshot.blocklists[0]?.id ?? "");
    }

    const nextTrack = snapshot.suggestions[0] ?? fallbackTracks[0];
    setCurrentTrack((current) =>
      current.title === nextTrack.title && current.artist === nextTrack.artist ? current : nextTrack
    );
  }, [selectedListId, snapshot]);

  async function refreshSnapshot(userId: string) {
    setLoadingData(true);
    setErrorMessage(null);

    try {
      const data = await loadDashboardSnapshot(getBrowserSupabaseClient(), userId);
      setSnapshot(data);
      setNotice("Autoskip rules are live and synced from Supabase.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load your blocklists.";
      setErrorMessage(message);
    } finally {
      setLoadingData(false);
    }
  }

  const entitlement = snapshot?.entitlement;
  const blocklists = snapshot?.blocklists ?? [];
  const items = snapshot?.items ?? [];
  const suggestions = snapshot?.suggestions.length ? snapshot.suggestions : fallbackTracks;
  const enabledIds = useMemo(() => getEnabledBlocklistIds(blocklists), [blocklists]);
  const match = matchTrackAgainstItems(currentTrack, items, enabledIds);
  const selectedList = blocklists.find((blocklist) => blocklist.id === selectedListId) ?? blocklists[0];
  const itemsInSelectedList = items.filter((item) => item.blocklistId === selectedList?.id);
  const blocklistLimit = entitlement?.blocklistLimit ?? 0;
  const itemLimit = entitlement?.itemsPerBlocklistLimit ?? null;
  const blocklistUsageRatio = blocklistLimit ? Math.min(blocklists.length / blocklistLimit, 1) : 0;
  const itemUsageRatio = itemLimit ? Math.min(itemsInSelectedList.length / itemLimit, 1) : 0;
  const limitReached = itemLimit !== null && itemsInSelectedList.length >= itemLimit;

  async function toggleBlocklist(blocklist: Blocklist) {
    if (!session) {
      return;
    }

    startTransition(async () => {
      const { error } = await getBrowserSupabaseClient()
        .from("blocklists")
        .update({ enabled: !blocklist.enabled })
        .eq("id", blocklist.id);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await refreshSnapshot(session.user.id);
      setNotice(`${blocklist.name} is now ${blocklist.enabled ? "off" : "on"}.`);
    });
  }

  async function createBlocklist() {
    if (!session || !entitlement) {
      return;
    }

    if (!canCreateBlocklist(entitlement, blocklists.length)) {
      setNotice("Your current plan cannot create another blocklist.");
      return;
    }

    startTransition(async () => {
      const name = `New blocklist ${blocklists.length + 1}`;
      const { error } = await getBrowserSupabaseClient().from("blocklists").insert({
        user_id: session.user.id,
        name,
        enabled: true,
        sort_order: blocklists.length
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await refreshSnapshot(session.user.id);
      setNotice(`Created ${name}.`);
    });
  }

  async function addManualItem() {
    if (!session || !entitlement || !selectedList) {
      setNotice("Create or select a blocklist first.");
      return;
    }

    if (!canAddItemToBlocklist(entitlement, itemsInSelectedList.length)) {
      setNotice("This plan has reached its per-blocklist limit.");
      return;
    }

    if (entryType === "artist") {
      const artistValue = artistEntryValue.trim();

      if (!artistValue) {
        setNotice("Enter an artist name.");
        return;
      }

      const normalizedValue = makeArtistItemValue(artistValue);

      startTransition(async () => {
        const { error } = await getBrowserSupabaseClient().from("blocklist_items").insert({
          blocklist_id: selectedList.id,
          type: entryType,
          display_value: artistValue,
          normalized_value: normalizedValue,
          source: "manual"
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setArtistEntryValue("");
        await refreshSnapshot(session.user.id);
        setNotice(`Added ${entryType} rule to ${selectedList.name}.`);
      });

      return;
    }

    const songTitle = songTitleEntryValue.trim();
    const songArtist = songArtistEntryValue.trim();

    if (!songTitle || !songArtist) {
      setNotice("Enter both the song title and artist name.");
      return;
    }

    const parsedTrack: TrackSnapshot = {
      title: songTitle,
      artist: songArtist
    };

    startTransition(async () => {
      const { error } = await getBrowserSupabaseClient().from("blocklist_items").insert({
        blocklist_id: selectedList.id,
        type: entryType,
        display_value: `${parsedTrack.title} - ${parsedTrack.artist}`,
        normalized_value: makeSongItemValue(parsedTrack),
        source: "manual"
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSongTitleEntryValue("");
      setSongArtistEntryValue("");
      await refreshSnapshot(session.user.id);
      setNotice(`Added ${entryType} rule to ${selectedList.name}.`);
    });
  }

  async function removeItem(itemId: string) {
    if (!session) {
      return;
    }

    startTransition(async () => {
      const { error } = await getBrowserSupabaseClient().from("blocklist_items").delete().eq("id", itemId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await refreshSnapshot(session.user.id);
      setNotice("Rule removed from this blocklist.");
    });
  }

  async function quickAdd(kind: BlockItemType) {
    if (!session || !entitlement || !selectedList) {
      setNotice("Create or select a blocklist first.");
      return;
    }

    if (!canAddItemToBlocklist(entitlement, itemsInSelectedList.length)) {
      setNotice("Upgrade to add more items to this blocklist.");
      return;
    }

    const displayValue =
      kind === "artist" ? currentTrack.artist : `${currentTrack.title} - ${currentTrack.artist}`;
    const normalizedValue =
      kind === "artist" ? makeArtistItemValue(currentTrack.artist) : makeSongItemValue(currentTrack);

    startTransition(async () => {
      const { error } = await getBrowserSupabaseClient().from("blocklist_items").insert({
        blocklist_id: selectedList.id,
        type: kind,
        display_value: displayValue,
        normalized_value: normalizedValue,
        source: "current_track"
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await refreshSnapshot(session.user.id);
      setNotice(`Saved the current ${kind} to ${selectedList.name}.`);
    });
  }

  if (!ready) {
    return (
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h2>Checking your session</h2>
        <p>Loading Purrify account state…</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="panel auth-panel">
        <p className="eyebrow">Dashboard</p>
        <h2>Sign in to create real blocklists</h2>
        <p>
          Google auth is ready. Once you sign in, this dashboard will read and write your live
          Supabase blocklists instead of the scaffold data.
        </p>
        {supabaseReady ? (
          <div className="button-row">
            <button
              className="primary-button"
              onClick={() =>
                startTransition(async () => {
                  setErrorMessage(null);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setErrorMessage(error.message);
                  }
                })
              }
              type="button"
            >
              {isPending ? "Redirecting…" : "Sign in with Google"}
            </button>
          </div>
        ) : null}
        {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
      </section>
    );
  }

  if (loadingData && !snapshot) {
    return (
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h2>Loading your blocklists</h2>
        <p>Fetching entitlements, rules, and recent playback history from Supabase…</p>
      </section>
    );
  }

  if (!snapshot || !entitlement) {
    return (
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h2>Dashboard data is unavailable</h2>
        <p>{errorMessage ?? "We could not load your account right now."}</p>
      </section>
    );
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
            <p className="muted">Now previewing</p>
            <strong>{currentTrack.title}</strong>
            <p>{currentTrack.artist}</p>
          </div>
          <div className="button-row">
            {suggestions.map((track) => (
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
            ? `This track matches a ${match.item.type} rule and would skip immediately in autoskip mode.`
            : "No active rule matches this track right now."}
        </p>

        <div className="button-row">
          <button className="primary-button" onClick={() => void quickAdd("song")} type="button">
            Block current song
          </button>
          <button className="secondary-button" onClick={() => void quickAdd("artist")} type="button">
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
          <button className="ghost-button" onClick={() => void createBlocklist()} type="button">
            New blocklist
          </button>
        </div>

        <div className="stack-list">
          {blocklists.length === 0 ? (
            <div className="empty-card">
              <strong>No blocklists yet</strong>
              <p>Create your first blocklist to start saving artists or songs.</p>
            </div>
          ) : null}
          <div className="dashboard-metrics">
            <div className="metric-chip">
              <span>Lists used</span>
              <strong>
                {blocklists.length}/{blocklistLimit}
              </strong>
            </div>
            <div className="metric-chip">
              <span>Active now</span>
              <strong>{enabledIds.size}</strong>
            </div>
          </div>
          <div className="usage-track" aria-hidden="true">
            <span className="usage-fill sage" style={{ width: `${blocklistUsageRatio * 100}%` }} />
          </div>
          {blocklists.map((blocklist) => {
            const itemCount = items.filter((item) => item.blocklistId === blocklist.id).length;
            return (
              <div key={blocklist.id} className={`list-row ${blocklist.id === selectedListId ? "selected" : ""}`}>
                <button
                  className="list-row-main"
                  onClick={() => setSelectedListId(blocklist.id)}
                  type="button"
                >
                  <div className="list-row-copy">
                    <strong>{blocklist.name}</strong>
                    <div className="meta-row">
                      <span className="meta-pill">{itemCount} rules</span>
                      <span className={`meta-pill ${blocklist.enabled ? "active" : "idle"}`}>
                        {blocklist.enabled ? "Listening" : "Paused"}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="switch-wrap">
                  <button
                    aria-label={`Turn ${blocklist.name} ${blocklist.enabled ? "off" : "on"}`}
                    aria-pressed={blocklist.enabled}
                    className={`switch-button ${blocklist.enabled ? "on" : "off"}`}
                    onClick={() => void toggleBlocklist(blocklist)}
                    type="button"
                  >
                    <span className="switch-thumb" />
                  </button>
                  <span className="switch-copy">{blocklist.enabled ? "On" : "Off"}</span>
                </div>
              </div>
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
          <div className="usage-summary">
            <strong>
              {itemsInSelectedList.length}/{itemLimit ?? "∞"} used
            </strong>
            <span className="muted">{selectedList ? selectedList.name : "Pick a list first"}</span>
          </div>
        </div>

        <div className="usage-card">
          <div className="usage-copy">
            <strong>{selectedList ? `${selectedList.name} capacity` : "Choose a blocklist"}</strong>
            <span>
              {itemLimit === null
                ? "Unlimited item slots on this plan."
                : `${Math.max(itemLimit - itemsInSelectedList.length, 0)} slots left before this list is full.`}
            </span>
          </div>
          <div className="usage-track" aria-hidden="true">
            <span className="usage-fill warm" style={{ width: `${itemUsageRatio * 100}%` }} />
          </div>
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

          <div className="field-stack">
            <span className="field-label">Type</span>
            <div className="type-toggle" role="tablist" aria-label="Rule type">
              <span className={`type-toggle-pill ${entryType === "song" ? "song" : "artist"}`} />
              <button
                aria-selected={entryType === "artist"}
                className={`type-toggle-option ${entryType === "artist" ? "active" : ""}`}
                onClick={() => setEntryType("artist")}
                role="tab"
                type="button"
              >
                Artist
              </button>
              <button
                aria-selected={entryType === "song"}
                className={`type-toggle-option ${entryType === "song" ? "active" : ""}`}
                onClick={() => setEntryType("song")}
                role="tab"
                type="button"
              >
                Song
              </button>
            </div>
          </div>
        </div>

        {entryType === "artist" ? (
          <label>
            <span>Artist name</span>
            <input
              onChange={(event) => setArtistEntryValue(event.target.value)}
              placeholder="Luke Faux"
              value={artistEntryValue}
            />
          </label>
        ) : (
          <div className="form-grid">
            <label>
              <span>Song title</span>
              <input
                onChange={(event) => setSongTitleEntryValue(event.target.value)}
                placeholder="Replay Again"
                value={songTitleEntryValue}
              />
            </label>

            <label>
              <span>Song artist</span>
              <input
                onChange={(event) => setSongArtistEntryValue(event.target.value)}
                placeholder="Mia North"
                value={songArtistEntryValue}
              />
            </label>
          </div>
        )}

        <button
          className="primary-button"
          disabled={limitReached || !selectedList}
          onClick={() => void addManualItem()}
          type="button"
        >
          {limitReached ? "List full" : "Add rule"}
        </button>
        <p className="notice-line">{notice}</p>
        {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

        <div className="rules-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Rules</p>
              <h2>{selectedList ? `Inside ${selectedList.name}` : "Select a blocklist"}</h2>
            </div>
            <span className="muted">
              {itemsInSelectedList.length} saved {itemsInSelectedList.length === 1 ? "rule" : "rules"}
            </span>
          </div>

          {itemsInSelectedList.length === 0 ? (
            <div className="empty-card">
              <strong>No rules yet</strong>
              <p>Add an artist or song rule above, or save the current track preview.</p>
            </div>
          ) : (
            <div className="rule-list">
              {itemsInSelectedList.map((item) => (
                <div key={item.id} className="rule-card">
                  <div className="rule-card-copy">
                    <span className={`meta-pill ${item.type === "song" ? "song" : "artist"}`}>{item.type}</span>
                    <strong>{item.displayValue}</strong>
                    <p className="muted">
                      Added from {item.source === "current_track" ? "current track" : "manual entry"}
                    </p>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() => void removeItem(item.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Suggestions</p>
            <h2>Seen from your recent history</h2>
          </div>
        </div>
        <div className="pill-grid">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.title}-${suggestion.artist}`}
              className="pill-button"
              onClick={() => {
                setEntryType("song");
                setSongTitleEntryValue(suggestion.title);
                setSongArtistEntryValue(suggestion.artist);
              }}
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
