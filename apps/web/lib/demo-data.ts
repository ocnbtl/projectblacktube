import { buildHistorySuggestions, sampleAnalytics, sampleBlocklists, sampleEntitlement, sampleEvents, sampleItems } from "@blacktube/shared";

export const marketingPoints = [
  {
    title: "Real control",
    description: "Create hard artist and song blocks instead of relying on thumbs down."
  },
  {
    title: "Mood-based toggles",
    description: "Turn whole blocklists on and off when your listening mood changes."
  },
  {
    title: "Built for YouTube Music",
    description: "The extension detects live playback on music.youtube.com and reacts immediately."
  }
];

export const workflowSteps = [
  "Install the Chrome extension and sign in with Google.",
  "Create a blocklist like Country, French, or Overplayed.",
  "Add artists or songs from the dashboard or the currently playing track.",
  "Purrify detects a match and autoskips or prompts depending on your mode."
];

export const demoCurrentTracks = [
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

export const dashboardSeed = {
  entitlement: sampleEntitlement,
  blocklists: sampleBlocklists,
  items: sampleItems,
  events: sampleEvents,
  analytics: sampleAnalytics,
  suggestions: buildHistorySuggestions(sampleEvents)
};

export const launchChecklist = [
  "Provision Supabase auth and apply the initial schema.",
  "Create Stripe products and yearly/monthly prices.",
  "Load the extension unpacked and confirm selectors on live playback.",
  "Wire the extension sync endpoints to authenticated users."
];

