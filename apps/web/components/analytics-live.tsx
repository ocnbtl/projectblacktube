"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AnalyticsBars } from "@/components/analytics-bars";
import { isSupabaseConfigured } from "@/lib/env";
import { loadDashboardSnapshot } from "@/lib/purrify-data";
import { getBrowserSupabaseClient, signInWithGoogle } from "@/lib/supabase-browser";

export function AnalyticsLive() {
  const supabaseReady = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyticsLevel, setAnalyticsLevel] = useState<0 | 1 | 2>(0);
  const [analytics, setAnalytics] = useState({
    tracksSeen: 0,
    skipsTriggered: 0,
    promptsTriggered: 0,
    matchedTracks: 0
  });
  const [events, setEvents] = useState<
    Array<{
      id: string;
      title: string;
      artist: string;
      action: "played" | "skipped" | "prompted";
    }>
  >([]);

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
      setAnalyticsLevel(0);
      setEvents([]);
      return;
    }

    void loadAnalytics(session.user.id);
  }, [session]);

  async function loadAnalytics(userId: string) {
    setLoading(true);
    setErrorMessage(null);

    try {
      const snapshot = await loadDashboardSnapshot(getBrowserSupabaseClient(), userId);
      setAnalytics(snapshot.analytics);
      setAnalyticsLevel(snapshot.entitlement.analyticsLevel);
      setEvents(
        snapshot.events.map((event) => ({
          id: event.id,
          title: event.title,
          artist: event.artist,
          action: event.action
        }))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load analytics.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <section className="panel">
        <p className="eyebrow">Analytics</p>
        <h2>Checking your session</h2>
        <p>Loading account state…</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="panel auth-panel">
        <p className="eyebrow">Analytics</p>
        <h2>Sign in to unlock your account analytics</h2>
        <p>The analytics page now reads recent playback data from Supabase instead of the scaffold samples.</p>
        {supabaseReady ? (
          <button className="primary-button" onClick={() => void signInWithGoogle()} type="button">
            Sign in with Google
          </button>
        ) : null}
        {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel">
        <p className="eyebrow">Analytics</p>
        <h2>Loading recent playback data</h2>
        <p>Fetching your most recent events and calculating matched tracks…</p>
      </section>
    );
  }

  if (analyticsLevel === 0) {
    return (
      <section className="panel auth-panel">
        <p className="eyebrow">Analytics</p>
        <h2>Upgrade to unlock account analytics</h2>
        <p>
          Your free plan can create blocklists, but Cheap is the first tier that unlocks account
          analytics. The dashboard data is already connected; pricing is the remaining gate.
        </p>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <AnalyticsBars {...analytics} />
      </section>

      <section className="split-panel">
        <article className="panel">
          <p className="eyebrow">Recent activity</p>
          <h2>Playback event history</h2>
          <div className="event-list">
            {events.length === 0 ? (
              <div className="empty-card">
                <strong>No playback events yet</strong>
                <p>Load the extension and start listening to populate analytics.</p>
              </div>
            ) : null}
            {events.map((event) => (
              <div className="event-row" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.artist}</p>
                </div>
                <span className={`status-chip ${event.action === "skipped" ? "warn" : "ok"}`}>
                  {event.action}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Tiered access</p>
          <h2>Current analytics entitlement</h2>
          <ul className="feature-list">
            <li>Cheap unlocks recent metrics and event history.</li>
            <li>Unlimited remains the tier for deeper history, filters, and export.</li>
            <li>The page is now reading your real account rows instead of seeded samples.</li>
          </ul>
          {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
        </article>
      </section>
    </div>
  );
}
