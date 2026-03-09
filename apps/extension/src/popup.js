import { buildSongDisplay } from "./lib.js";

const elements = {
  statusLine: document.getElementById("status-line"),
  trackBox: document.getElementById("track-box"),
  blockSong: document.getElementById("block-song"),
  blockArtist: document.getElementById("block-artist"),
  autoMode: document.getElementById("mode-autoskip"),
  promptMode: document.getElementById("mode-prompt"),
  blocklistList: document.getElementById("blocklist-list"),
  manualBlocklist: document.getElementById("manual-blocklist"),
  manualType: document.getElementById("manual-type"),
  manualValue: document.getElementById("manual-value"),
  addManualRule: document.getElementById("add-manual-rule"),
  newBlocklist: document.getElementById("new-blocklist"),
  eventList: document.getElementById("event-list"),
  clearEvents: document.getElementById("clear-events")
};

let runtimeState = null;
let currentTrack = null;

async function messageWorker(message) {
  return chrome.runtime.sendMessage(message);
}

async function getMusicTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs.find((tab) => tab.url?.startsWith("https://music.youtube.com")) ?? null;
}

async function messageActiveTab(message) {
  const tab = await getMusicTab();
  if (!tab?.id) {
    return null;
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null;
  }
}

function setStatus(text) {
  elements.statusLine.textContent = text;
}

function renderCurrentTrack() {
  if (!currentTrack) {
    const title = document.createElement("strong");
    title.textContent = "Open music.youtube.com";
    const subtitle = document.createElement("span");
    subtitle.textContent = "Then pin Purrify for quick add.";
    elements.trackBox.replaceChildren(title, subtitle);
    return;
  }

  const title = document.createElement("strong");
  title.textContent = currentTrack.title;
  const subtitle = document.createElement("span");
  subtitle.textContent = currentTrack.artist;
  elements.trackBox.replaceChildren(title, subtitle);
}

function renderBlocklists() {
  elements.blocklistList.innerHTML = "";
  elements.manualBlocklist.innerHTML = "";

  for (const blocklist of runtimeState.blocklists) {
    const row = document.createElement("div");
    row.className = "stack-row";
    const left = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = blocklist.name;
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = blocklist.enabled ? "On" : "Off";
    left.append(name, pill);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = blocklist.enabled ? "Disable" : "Enable";
    toggle.addEventListener("click", async () => {
      await messageWorker({ type: "TOGGLE_BLOCKLIST", blocklistId: blocklist.id });
      await refresh();
    });

    row.append(left, toggle);
    elements.blocklistList.append(row);

    const option = document.createElement("option");
    option.value = blocklist.id;
    option.textContent = blocklist.name;
    elements.manualBlocklist.append(option);
  }
}

function renderEvents() {
  elements.eventList.innerHTML = "";

  const events = runtimeState.events.slice(0, 6);
  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "stack-row";
    const text = document.createElement("span");
    text.textContent = "No events yet.";
    empty.append(text);
    elements.eventList.replaceChildren(empty);
    return;
  }

  for (const event of events) {
    const row = document.createElement("div");
    row.className = "stack-row";
    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = event.title;
    const artist = document.createElement("div");
    artist.className = "muted";
    artist.textContent = event.artist;
    left.append(title, artist);

    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = event.action;
    row.append(left, pill);
    elements.eventList.append(row);
  }
}

function renderMode() {
  elements.autoMode.classList.toggle("active", runtimeState.mode === "autoskip");
  elements.promptMode.classList.toggle("active", runtimeState.mode === "prompt");
}

async function refresh() {
  const stateResponse = await messageWorker({ type: "GET_STATE" });
  runtimeState = stateResponse.state;
  const trackResponse = await messageActiveTab({ type: "GET_CURRENT_TRACK" });
  currentTrack = trackResponse?.track ?? null;

  setStatus(
    currentTrack
      ? `${runtimeState.mode === "autoskip" ? "Autoskip" : "Prompt mode"} is ready on YouTube Music.`
      : "Open an active YouTube Music tab to use quick add."
  );

  renderCurrentTrack();
  renderBlocklists();
  renderEvents();
  renderMode();
}

elements.autoMode.addEventListener("click", async () => {
  await messageWorker({ type: "SET_MODE", mode: "autoskip" });
  await refresh();
});

elements.promptMode.addEventListener("click", async () => {
  await messageWorker({ type: "SET_MODE", mode: "prompt" });
  await refresh();
});

elements.blockSong.addEventListener("click", async () => {
  if (!currentTrack) {
    setStatus("No live YouTube Music track found.");
    return;
  }

  await messageWorker({
    type: "ADD_CURRENT_TRACK",
    kind: "song",
    blocklistId: elements.manualBlocklist.value,
    track: currentTrack
  });
  setStatus(`Blocked song: ${buildSongDisplay(currentTrack)}`);
  await refresh();
});

elements.blockArtist.addEventListener("click", async () => {
  if (!currentTrack) {
    setStatus("No live YouTube Music track found.");
    return;
  }

  await messageWorker({
    type: "ADD_CURRENT_TRACK",
    kind: "artist",
    blocklistId: elements.manualBlocklist.value,
    track: currentTrack
  });
  setStatus(`Blocked artist: ${currentTrack.artist}`);
  await refresh();
});

elements.addManualRule.addEventListener("click", async () => {
  const response = await messageWorker({
    type: "ADD_MANUAL_RULE",
    blocklistId: elements.manualBlocklist.value,
    kind: elements.manualType.value,
    value: elements.manualValue.value
  });

  if (!response.ok) {
    setStatus(response.error);
    return;
  }

  elements.manualValue.value = "";
  setStatus("Manual rule saved.");
  await refresh();
});

elements.newBlocklist.addEventListener("click", async () => {
  const name = `Blocklist ${runtimeState.blocklists.length + 1}`;
  await messageWorker({ type: "ADD_BLOCKLIST", name });
  setStatus(`Created ${name}.`);
  await refresh();
});

elements.clearEvents.addEventListener("click", async () => {
  await messageWorker({ type: "CLEAR_EVENTS" });
  setStatus("Cleared local playback history.");
  await refresh();
});

refresh();
