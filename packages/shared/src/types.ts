export type PlanCode = "free" | "cheap" | "unlimited";
export type PlanStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";
export type BillingCycle = "monthly" | "yearly";
export type BlockItemType = "artist" | "song";
export type BlockItemSource = "manual" | "current_track" | "history_suggestion";
export type PlaybackAction = "played" | "skipped" | "prompted";

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  blocklistLimit: number;
  itemsPerBlocklistLimit: number | null;
  analyticsLevel: 0 | 1 | 2;
  features: string[];
}

export interface SubscriptionEntitlement {
  plan: PlanCode;
  status: PlanStatus;
  billingCycle: BillingCycle;
  blocklistLimit: number;
  itemsPerBlocklistLimit: number | null;
  analyticsLevel: 0 | 1 | 2;
}

export interface Blocklist {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
}

export interface BlocklistItem {
  id: string;
  blocklistId: string;
  type: BlockItemType;
  displayValue: string;
  normalizedValue: string;
  source: BlockItemSource;
  externalReference?: string | null;
}

export interface TrackSnapshot {
  title: string;
  artist: string;
}

export interface MatchedRule {
  item: BlocklistItem;
  normalizedTrackKey: string;
}

export interface PlaybackEvent {
  id: string;
  title: string;
  artist: string;
  normalizedTitle: string;
  normalizedArtist: string;
  seenAt: string;
  action: PlaybackAction;
  matchedItemId?: string | null;
}

export interface AnalyticsSnapshot {
  tracksSeen: number;
  skipsTriggered: number;
  promptsTriggered: number;
  matchedTracks: number;
}

