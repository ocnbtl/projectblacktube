"use client";

import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { getAuthDisplayName } from "@/lib/purrify-data";
import { getBrowserSupabaseClient, signInWithGoogle, signOut } from "@/lib/supabase-browser";

export function AuthControls() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
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
  }, []);

  if (!ready) {
    return <span className="status-chip">Checking session…</span>;
  }

  if (!isSupabaseConfigured()) {
    return <span className="status-chip warn">Supabase env missing</span>;
  }

  if (!session) {
    return (
      <button
        className="secondary-button"
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
    );
  }

  return (
    <div className="auth-status">
      <div className="auth-copy">
        <span className="eyebrow">Signed in</span>
        <strong>{getAuthDisplayName(session.user)}</strong>
      </div>
      <button
        className="ghost-button"
        onClick={() =>
          startTransition(async () => {
            setErrorMessage(null);
            const { error } = await signOut();
            if (error) {
              setErrorMessage(error.message);
            }
          })
        }
        type="button"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
    </div>
  );
}
