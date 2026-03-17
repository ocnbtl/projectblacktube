import { normalizeArtist, normalizeTitle, type PlaybackAction } from "@blacktube/shared";

import { createSupabaseServerClient } from "@/lib/supabase-server";

interface IncomingEvent {
  title: string;
  artist: string;
  seenAt?: string;
  action?: PlaybackAction;
  matchedItemId?: string | null;
  metadata?: Record<string, unknown>;
}

async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}

function toRows(userId: string, payload: unknown) {
  const events = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { events?: unknown[] }).events)
      ? (payload as { events: unknown[] }).events
      : [payload];

  return events.flatMap((event) => {
    if (!event || typeof event !== "object") {
      return [];
    }

    const item = event as IncomingEvent;

    if (!item.title || !item.artist) {
      return [];
    }

    return [
      {
        user_id: userId,
        title: item.title,
        artist: item.artist,
        normalized_title: normalizeTitle(item.title),
        normalized_artist: normalizeArtist(item.artist),
        seen_at: item.seenAt ?? new Date().toISOString(),
        action: item.action ?? "played",
        matched_item_id: item.matchedItemId ?? null,
        metadata: item.metadata ?? {}
      }
    ];
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const rows = toRows(auth.user.id, payload);

  if (rows.length === 0) {
    return Response.json({ error: "No valid playback events were supplied." }, { status: 400 });
  }

  const { error } = await auth.supabase.from("playback_events").insert(rows);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(
    {
      accepted: true,
      count: rows.length,
      source: "supabase",
      receivedAt: new Date().toISOString()
    },
    { status: 202 }
  );
}
