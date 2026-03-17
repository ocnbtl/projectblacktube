import {
  buildHistorySuggestions,
  makeEntitlement,
  type AnalyticsSnapshot,
  type BillingCycle,
  type BlockItemSource,
  type BlockItemType,
  type Blocklist,
  type BlocklistItem,
  type PlanCode,
  type PlanStatus,
  type PlaybackAction,
  type PlaybackEvent,
  type SubscriptionEntitlement,
  type TrackSnapshot
} from "@blacktube/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

interface EntitlementRow {
  plan: PlanCode;
  status: PlanStatus;
  billing_cycle: BillingCycle;
  blocklist_limit: number;
  items_per_blocklist_limit: number | null;
  analytics_level: 0 | 1 | 2;
}

interface BlocklistRow {
  id: string;
  name: string;
  enabled: boolean;
  sort_order: number;
}

interface BlocklistItemRow {
  id: string;
  blocklist_id: string;
  type: BlockItemType;
  display_value: string;
  normalized_value: string;
  source: BlockItemSource;
  external_reference: string | null;
}

interface PlaybackEventRow {
  id: string;
  title: string;
  artist: string;
  normalized_title: string;
  normalized_artist: string;
  seen_at: string;
  action: PlaybackAction;
  matched_item_id: string | null;
}

export interface DashboardSnapshot {
  entitlement: SubscriptionEntitlement;
  blocklists: Blocklist[];
  items: BlocklistItem[];
  events: PlaybackEvent[];
  analytics: AnalyticsSnapshot;
  suggestions: TrackSnapshot[];
}

export function getAuthDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;

  return fullName ?? name ?? user.email ?? "Signed in";
}

function mapEntitlementRow(row: EntitlementRow | null): SubscriptionEntitlement {
  if (!row) {
    return makeEntitlement("free");
  }

  return {
    plan: row.plan,
    status: row.status,
    billingCycle: row.billing_cycle,
    blocklistLimit: row.blocklist_limit,
    itemsPerBlocklistLimit: row.items_per_blocklist_limit,
    analyticsLevel: row.analytics_level
  };
}

function mapBlocklistRow(row: BlocklistRow): Blocklist {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    sortOrder: row.sort_order
  };
}

function mapBlocklistItemRow(row: BlocklistItemRow): BlocklistItem {
  return {
    id: row.id,
    blocklistId: row.blocklist_id,
    type: row.type,
    displayValue: row.display_value,
    normalizedValue: row.normalized_value,
    source: row.source,
    externalReference: row.external_reference
  };
}

function mapPlaybackEventRow(row: PlaybackEventRow): PlaybackEvent {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    normalizedTitle: row.normalized_title,
    normalizedArtist: row.normalized_artist,
    seenAt: row.seen_at,
    action: row.action,
    matchedItemId: row.matched_item_id
  };
}

function buildAnalytics(events: PlaybackEvent[]): AnalyticsSnapshot {
  return {
    tracksSeen: events.filter((event) => event.action === "played").length,
    skipsTriggered: events.filter((event) => event.action === "skipped").length,
    promptsTriggered: events.filter((event) => event.action === "prompted").length,
    matchedTracks: events.filter((event) => event.matchedItemId).length
  };
}

export async function loadDashboardSnapshot(supabase: SupabaseClient, userId: string): Promise<DashboardSnapshot> {
  const [entitlementResult, blocklistsResult, itemsResult, eventsResult] = await Promise.all([
    supabase
      .from("subscription_entitlements")
      .select("plan, status, billing_cycle, blocklist_limit, items_per_blocklist_limit, analytics_level")
      .eq("user_id", userId)
      .maybeSingle<EntitlementRow>(),
    supabase.from("blocklists").select("id, name, enabled, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("blocklist_items")
      .select("id, blocklist_id, type, display_value, normalized_value, source, external_reference")
      .order("created_at", { ascending: false }),
    supabase
      .from("playback_events")
      .select("id, title, artist, normalized_title, normalized_artist, seen_at, action, matched_item_id")
      .eq("user_id", userId)
      .order("seen_at", { ascending: false })
      .limit(24)
  ]);

  if (entitlementResult.error) {
    throw entitlementResult.error;
  }

  if (blocklistsResult.error) {
    throw blocklistsResult.error;
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  const entitlement = mapEntitlementRow(entitlementResult.data);
  const blocklists = (blocklistsResult.data ?? []).map(mapBlocklistRow);
  const items = (itemsResult.data ?? []).map(mapBlocklistItemRow);
  const events = (eventsResult.data ?? []).map(mapPlaybackEventRow);

  return {
    entitlement,
    blocklists,
    items,
    events,
    analytics: buildAnalytics(events),
    suggestions: buildHistorySuggestions(events)
  };
}
