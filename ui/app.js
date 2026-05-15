const translations = {
  de: {
    eyebrow: "Caruso Reborn",
    heroTitle: "Caruso Reborn",
    heroLead: "Sender suchen, als Favorit in die browsbare Senderliste legen und live sehen, was dein Caruso gerade macht.",
    refresh: "Neu laden",
    openBrowser: "Im Browser",
    nowPlaying: "Live Status",
    selectedRenderer: "Ausgewaehlter Renderer",
    transport: "Transport",
    currentSource: "Aktuelle Quelle",
    quality: "Qualitaet",
    position: "Position",
    publicUrl: "Public URL",
    serverConfig: "Server & Konfiguration",
    serverMetricsTitle: "Server",
    startServer: "Server starten",
    stopServer: "Server stoppen",
    carusoFilter: "Caruso Filter",
    deezerArl: "Deezer ARL",
    saveConfig: "Konfiguration speichern",
    favoritesTitle: "Senderliste fuer den Caruso",
    favoritesLead: "Alles hier erscheint im browsbaren UPnP-Menue unter TuneIn > Sender.",
    rendererTitle: "Caruso / Renderer",
    rediscover: "UPnP neu suchen",
    tuneinTitle: "TuneIn Suche",
    radioBrowserTitle: "Hi-Quality Radio",
    radioBrowserLead: "Alternative Suche ueber Radio Browser. Nach Bitrate sortiert, gut fuer stabilere oder hochwertigere Streams.",
    tuneinBrowseTitle: "TuneIn Browser",
    search: "Suchen",
    browseBack: "Zurueck",
    browseRoot: "Root",
    localMusicTitle: "Lokale Musik",
    chooseFolder: "Ordner waehlen",
    addFolder: "Ordner hinzufuegen",
    emptyRenderers: "Noch kein Renderer gefunden.",
    emptyTuneIn: "Noch keine TuneIn-Ergebnisse.",
    emptyRadioBrowser: "Noch keine Radio-Browser-Ergebnisse.",
    emptyFavorites: "Noch keine Sender auf der Caruso-Senderliste.",
    emptyFolders: "Noch kein Musikordner hinterlegt.",
    emptyTracks: "Noch keine lokalen Audiodateien gefunden.",
    select: "Auswaehlen",
    selected: "Ausgewaehlt",
    addToList: "Zur Senderliste",
    playNow: "Jetzt spielen",
    remove: "Entfernen",
    play: "Spielen",
    compatible: "wahrscheinlich kompatibel",
    risky: "Unsicher",
    unknownState: "Ungeprueft",
    streamType: "Stream",
    unknown: "Unbekannt",
    rendererNeeded: "Bitte zuerst einen Renderer auswaehlen.",
    folderNeeded: "Bitte einen Musikordner angeben.",
    searchNeeded: "Bitte einen Suchbegriff eingeben.",
    folderAdded: "Musikordner hinzugefuegt.",
    configSaved: "Konfiguration gespeichert.",
    favoritesSaved: "Sender zur Caruso-Senderliste hinzugefuegt.",
    playNowStarted: "Sender wird am Caruso abgespielt.",
    favoriteRemoved: "Sender entfernt.",
    rediscovered: "UPnP-Suche abgeschlossen.",
    localSent: "Lokalen Track an den Caruso gesendet.",
    startDesktopOnly: "Starten ist nur in der Desktop-App verfuegbar.",
    stopDesktopOnly: "Stoppen ist nur in der Desktop-App verfuegbar.",
    chooseDesktopOnly: "Ordnerwahl ist nur in der Desktop-App verfuegbar."
  },
  en: {
    eyebrow: "Caruso Reborn",
    heroTitle: "Caruso Reborn",
    heroLead: "Search stations, pin them into a browsable station list and watch your Caruso status live.",
    refresh: "Refresh",
    openBrowser: "Open in browser",
    nowPlaying: "Live Status",
    selectedRenderer: "Selected Renderer",
    transport: "Transport",
    currentSource: "Current Source",
    quality: "Quality",
    position: "Position",
    publicUrl: "Public URL",
    serverConfig: "Server & Configuration",
    serverMetricsTitle: "Server",
    startServer: "Start server",
    stopServer: "Stop server",
    carusoFilter: "Caruso filter",
    deezerArl: "Deezer ARL",
    saveConfig: "Save configuration",
    favoritesTitle: "Station list for Caruso",
    favoritesLead: "Everything here appears in the browsable UPnP menu under TuneIn > Sender.",
    rendererTitle: "Caruso / Renderer",
    rediscover: "Rediscover UPnP",
    tuneinTitle: "TuneIn Search",
    radioBrowserTitle: "Hi-Quality Radio",
    radioBrowserLead: "Alternative search powered by Radio Browser. Sorted by bitrate to help find more stable or higher-quality streams.",
    tuneinBrowseTitle: "TuneIn Browser",
    search: "Search",
    browseBack: "Back",
    browseRoot: "Root",
    localMusicTitle: "Local Music",
    chooseFolder: "Choose folder",
    addFolder: "Add folder",
    emptyRenderers: "No renderer found yet.",
    emptyTuneIn: "No TuneIn results yet.",
    emptyRadioBrowser: "No Radio Browser results yet.",
    emptyFavorites: "No stations on the Caruso station list yet.",
    emptyFolders: "No music folder configured yet.",
    emptyTracks: "No local audio files found yet.",
    select: "Select",
    selected: "Selected",
    addToList: "Add to list",
    playNow: "Play now",
    remove: "Remove",
    play: "Play",
    compatible: "likely compatible",
    risky: "Risky",
    unknownState: "Untested",
    streamType: "Stream",
    unknown: "Unknown",
    rendererNeeded: "Please select a renderer first.",
    folderNeeded: "Please enter a music folder.",
    searchNeeded: "Please enter a search term.",
    folderAdded: "Music folder added.",
    configSaved: "Configuration saved.",
    favoritesSaved: "Station added to the Caruso list.",
    playNowStarted: "Station is now playing on the Caruso.",
    favoriteRemoved: "Station removed.",
    rediscovered: "UPnP discovery finished.",
    localSent: "Local track sent to the Caruso.",
    startDesktopOnly: "Starting is only available in the desktop app.",
    stopDesktopOnly: "Stopping is only available in the desktop app.",
    chooseDesktopOnly: "Folder chooser is only available in the desktop app."
  }
};

const state = {
  language: "de",
  devices: [],
  selectedDeviceUrl: null,
  selectedDeviceName: null,
  tracks: [],
  folders: [],
  tuneinItems: [],
  radioBrowserItems: [],
  browseItems: [],
  browseStack: [],
  favorites: [],
  rendererStatus: null
};

const sectionRoutes = {
  dashboard: "dashboardSection",
  settings: "settingsSection",
  favorites: "favoritesSection",
  devices: "devicesSection",
  search: "searchSection",
  browse: "browseSection",
  library: "librarySection"
};

const elements = Object.fromEntries(
  [
    "refreshButton", "languageSelect", "serverBadge", "statusSummary", "startServerButton", "stopServerButton",
    "configForm", "publicBaseUrlInput", "carusoNameInput", "deezerArlInput", "discoverButton", "deviceList", "tuneinQueryInput",
    "tuneinSearchButton", "tuneinResults", "radioBrowserQueryInput", "radioBrowserSearchButton", "radioBrowserResults", "tuneinBrowseResults", "browseBackButton", "browseRootButton", "browsePathLabel", "favoriteStations", "folderInput", "chooseFolderButton", "addFolderButton", "libraryFolders",
    "localTracks", "toast", "selectedRendererLabel", "transportStateLabel", "currentTitleLabel", "qualityLabel", "positionLabel", "publicUrlLabel", "serverMetrics"
  ].map((id) => [id, document.querySelector(`#${id}`)])
);

function t(key) {
  return translations[state.language][key] || key;
}

function getSectionForRoute(route) {
  const resolvedId = sectionRoutes[route] || sectionRoutes.dashboard;
  return document.getElementById(resolvedId);
}

function focusRoute(route, behavior = "smooth") {
  document.querySelectorAll(".panel-targeted").forEach((node) => node.classList.remove("panel-targeted"));

  const section = getSectionForRoute(route);
  if (!section) {
    return;
  }

  section.classList.add("panel-targeted");
  section.scrollIntoView({ behavior, block: "start" });
}

function focusCurrentHash(behavior = "smooth") {
  const route = window.location.hash.replace(/^#/, "") || "dashboard";
  focusRoute(route, behavior);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodeDataValue(value) {
  return encodeURIComponent(String(value ?? ""));
}

function decodeDataValue(value) {
  return value ? decodeURIComponent(value) : "";
}

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

async function runWithToast(action, fallbackMessage) {
  try {
    await action();
  } catch (error) {
    showToast(getErrorMessage(error, fallbackMessage));
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => elements.toast.classList.add("hidden"), 2800);
}

async function api(path, options) {
  const headers = new Headers(options?.headers || {});
  if (options?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    headers,
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
}

function ensureRendererSelection() {
  if (!state.selectedDeviceUrl && state.devices[0]?.location) {
    state.selectedDeviceUrl = state.devices[0].location;
    state.selectedDeviceName = state.devices[0].description?.friendlyName || state.devices[0].location;
  }
}

function renderStatus(status, desktopState) {
  elements.serverBadge.textContent = desktopState?.running === false ? "Offline" : "Live";
  elements.publicUrlLabel.textContent = status.server.publicBaseUrl;
  elements.statusSummary.innerHTML = `
    <dt>${escapeHtml(t("publicUrl"))}</dt><dd>${escapeHtml(status.server.publicBaseUrl)}</dd>
    <dt>Tracks</dt><dd>${escapeHtml(status.library.trackCount)}</dd>
    <dt>Folders</dt><dd>${escapeHtml(status.library.folders.length)}</dd>
    <dt>Deezer</dt><dd>${escapeHtml(status.deezer.warning)}</dd>
  `;
  elements.publicBaseUrlInput.value = status.config.publicBaseUrl || "";
  elements.carusoNameInput.value = status.config.rendererFilterName || "";
  elements.deezerArlInput.value = "";
  elements.deezerArlInput.placeholder = status.config.deezerConfigured ? "Configured - leave blank to keep" : "Optional";
  state.language = status.config.uiLanguage || state.language;
  elements.languageSelect.value = state.language;
  state.folders = status.library.folders;
  state.favorites = status.tunein.favorites;
  applyTranslations();
  renderFolders();
  renderFavorites();
  renderServerMetrics(status.server.metrics);
}

function renderServerMetrics(metrics) {
  elements.serverMetrics.innerHTML = `
    <div class="status-card">
      <span class="status-label">CPU</span>
      <strong>${escapeHtml(metrics.cpuUsagePercent)}%</strong>
    </div>
    <div class="status-card">
      <span class="status-label">RAM App</span>
      <strong>${escapeHtml(metrics.processMemoryRss)}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">Heap</span>
      <strong>${escapeHtml(metrics.processHeapUsed)}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">RAM System</span>
      <strong>${escapeHtml(metrics.systemMemoryUsed)} / ${escapeHtml(metrics.systemMemoryTotal)}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">Uptime</span>
      <strong>${escapeHtml(formatDuration(metrics.uptimeSeconds))}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">Load 1m</span>
      <strong>${escapeHtml(metrics.loadAverage1m)}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">Host</span>
      <strong>${escapeHtml(metrics.hostname)}</strong>
    </div>
    <div class="status-card">
      <span class="status-label">System</span>
      <strong>${escapeHtml(metrics.platform)} · ${escapeHtml(metrics.cpuCores)} Cores</strong>
    </div>
  `;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function renderRendererStatus() {
  elements.selectedRendererLabel.textContent = state.selectedDeviceName || "-";
  elements.transportStateLabel.textContent = state.rendererStatus?.transportState || "-";
  elements.currentTitleLabel.innerHTML = renderCurrentSourceLabel(
    state.rendererStatus?.title || t("unknown"),
    state.rendererStatus?.quality || ""
  );
  elements.qualityLabel.textContent = state.rendererStatus?.quality || "-";
  elements.positionLabel.textContent = state.rendererStatus?.relativeTimePosition || "-";
}

function extractBitrate(qualityLabel) {
  const match = String(qualityLabel || "").match(/(\d+)\s*kbps/i);
  return match ? Number(match[1]) : null;
}

function normalizeDisplayTitle(title) {
  return String(title || "").replace(/\s*\|\s*HQ\s*$/i, "").trim();
}

function renderTitleWithHqBadge(title, bitrate) {
  const normalizedTitle = normalizeDisplayTitle(title);
  const hqBadge = bitrate && bitrate >= 192 ? '<span class="pill pill-warning source-hq-badge">HQ</span>' : "";
  return `<span class="source-label">${escapeHtml(normalizedTitle || title)}${hqBadge}</span>`;
}

function renderCurrentSourceLabel(title, qualityLabel) {
  const bitrate = extractBitrate(qualityLabel);
  return renderTitleWithHqBadge(title, bitrate);
}

function renderDevices() {
  ensureRendererSelection();

  if (state.devices.length === 0) {
    elements.deviceList.innerHTML = `<div class="empty">${t("emptyRenderers")}</div>`;
    return;
  }

  elements.deviceList.innerHTML = state.devices.map((device) => {
    const name = device.description?.friendlyName || device.location || device.address;
    const selected = state.selectedDeviceUrl === device.location;
    return `
      <div class="item">
        <div class="item-row">
          <div>
            <strong>${escapeHtml(name)}</strong>
            <div class="meta">${escapeHtml(device.description?.modelName || t("unknown"))} · ${escapeHtml(device.address)}</div>
          </div>
          <button class="button ${selected ? "button-secondary" : "button-ghost"}" data-select-device="${encodeDataValue(device.location || "")}" data-select-name="${encodeDataValue(name)}">
            ${selected ? t("selected") : t("select")}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function renderTuneIn() {
  if (state.tuneinItems.length === 0) {
    elements.tuneinResults.innerHTML = `<div class="empty">${t("emptyTuneIn")}</div>`;
    return;
  }

  elements.tuneinResults.innerHTML = state.tuneinItems.map((item) => `
    <div class="item">
        <div class="item-row">
          <div>
          <strong>${renderTitleWithHqBadge(item.text, item.bitrate)}</strong>
          <div class="meta">${escapeHtml(item.subtext || item.type)}${item.bitrate ? ` · ${escapeHtml(item.bitrate)} kbps` : ""}${item.formats ? ` · ${escapeHtml(item.formats.toUpperCase())}` : ""}</div>
          <div class="pill-row">${renderCompatibilityPills(item)}</div>
        </div>
        <div class="item-actions">
          <button class="button button-ghost" data-play-now="${encodeURIComponent(JSON.stringify({
            title: item.text,
            streamUrl: item.actions?.play,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("playNow")}</button>
          <button class="button button-secondary" data-add-favorite="${encodeURIComponent(JSON.stringify({
            id: item.guideId || item.text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title: item.text,
            streamUrl: item.actions?.play,
            subtitle: item.subtext,
            image: item.image,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("addToList")}</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderRadioBrowser() {
  if (state.radioBrowserItems.length === 0) {
    elements.radioBrowserResults.innerHTML = `<div class="empty">${t("emptyRadioBrowser")}</div>`;
    return;
  }

  elements.radioBrowserResults.innerHTML = state.radioBrowserItems.map((item) => `
    <div class="item">
        <div class="item-row">
          <div>
          <strong>${renderTitleWithHqBadge(item.text, item.bitrate)}</strong>
          <div class="meta">${escapeHtml(item.subtext || "Radio Browser")}${item.bitrate ? ` · ${escapeHtml(item.bitrate)} kbps` : ""}</div>
          <div class="pill-row">${renderCompatibilityPills(item)}</div>
        </div>
        <div class="item-actions">
          <button class="button button-ghost" data-play-now="${encodeURIComponent(JSON.stringify({
            title: item.text,
            streamUrl: item.actions?.play,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("playNow")}</button>
          <button class="button button-secondary" data-add-favorite="${encodeURIComponent(JSON.stringify({
            id: item.guideId || item.text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title: item.text,
            streamUrl: item.actions?.play,
            subtitle: item.subtext,
            image: item.image,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("addToList")}</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderTuneInBrowse() {
  elements.browsePathLabel.textContent = state.browseStack.length === 0
    ? "TuneIn"
    : ["TuneIn", ...state.browseStack.map((item) => item.text)].join(" / ");

  if (state.browseItems.length === 0) {
    elements.tuneinBrowseResults.innerHTML = `<div class="empty">${t("emptyTuneIn")}</div>`;
    return;
  }

  elements.tuneinBrowseResults.innerHTML = state.browseItems.map((item) => `
    <div class="item">
        <div class="item-row">
          <div>
          <strong>${renderTitleWithHqBadge(item.text, item.bitrate)}</strong>
          <div class="meta">${escapeHtml(item.subtext || item.type || "")}${item.bitrate ? ` · ${escapeHtml(item.bitrate)} kbps` : ""}${item.formats ? ` · ${escapeHtml(item.formats.toUpperCase())}` : ""}</div>
          ${item.type === "audio" ? `<div class="pill-row">${renderCompatibilityPills(item)}</div>` : ""}
        </div>
        <div class="item-actions">
          ${item.type === "link" && (item.actions?.browse || item.actions?.play) ? `<button class="button button-ghost" data-browse-link="${encodeDataValue(item.actions?.browse || item.actions?.play)}" data-browse-label="${encodeDataValue(item.text)}">${state.language === "en" ? "Open" : "Oeffnen"}</button>` : ""}
          ${item.type === "audio" && item.actions?.play ? `<button class="button button-ghost" data-play-now="${encodeURIComponent(JSON.stringify({
            title: item.text,
            streamUrl: item.actions.play,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("playNow")}</button>` : ""}
          ${item.type === "audio" && item.actions?.play ? `<button class="button button-secondary" data-add-favorite="${encodeURIComponent(JSON.stringify({
            id: item.guideId || item.text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title: item.text,
            streamUrl: item.actions.play,
            subtitle: item.subtext,
            image: item.image,
            bitrate: item.bitrate,
            mimeType: item.formats?.includes("aac") ? "audio/aac" : "audio/mpeg"
          }))}">${t("addToList")}</button>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}

function renderFavorites() {
  if (state.favorites.length === 0) {
    elements.favoriteStations.innerHTML = `<div class="empty">${t("emptyFavorites")}</div>`;
    return;
  }

  elements.favoriteStations.innerHTML = state.favorites.map((item) => `
    <div class="item">
        <div class="item-row">
          <div>
          <strong>${renderTitleWithHqBadge(item.title, item.bitrate)}</strong>
          <div class="meta">${escapeHtml(item.subtitle || "TuneIn")}${item.bitrate ? ` · ${escapeHtml(item.bitrate)} kbps` : ""}${item.mimeType ? ` · ${escapeHtml(item.mimeType)}` : ""}</div>
          <div class="pill-row">${renderFavoritePills(item)}</div>
        </div>
        <div class="item-actions">
          <button class="button button-ghost" data-play-now="${encodeURIComponent(JSON.stringify({
            title: item.title,
            streamUrl: item.streamUrl,
            bitrate: item.bitrate,
            mimeType: item.mimeType
          }))}">${t("playNow")}</button>
          <button type="button" class="button button-ghost" data-remove-favorite="${encodeDataValue(item.id)}" data-remove-title="${encodeDataValue(item.title)}">${t("remove")}</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderFolders() {
  if (state.folders.length === 0) {
    elements.libraryFolders.innerHTML = `<div class="empty">${t("emptyFolders")}</div>`;
    return;
  }

  elements.libraryFolders.innerHTML = state.folders.map((folder) => `
    <div class="item">
      <div class="item-row">
        <span>${escapeHtml(folder)}</span>
        <button class="button button-ghost" data-remove-folder="${encodeDataValue(folder)}">${t("remove")}</button>
      </div>
    </div>
  `).join("");
}

function renderTracks() {
  if (state.tracks.length === 0) {
    elements.localTracks.innerHTML = `<div class="empty">${t("emptyTracks")}</div>`;
    return;
  }

  elements.localTracks.innerHTML = state.tracks.slice(0, 150).map((track) => `
    <div class="item">
      <div class="item-row">
        <div>
          <strong>${escapeHtml(track.title)}</strong>
          <div class="meta">${escapeHtml(track.relativePath)}</div>
        </div>
        <button class="button" data-play-local="${encodeDataValue(track.id)}">${t("play")}</button>
      </div>
    </div>
  `).join("");
}

function renderCompatibilityPills(item) {
  const pills = [];
  const format = String(item.formats || "").toLowerCase();

  if (item.bitrate) {
    pills.push(`<span class="pill">${item.bitrate} kbps</span>`);
  }

  if (format.includes("mp3")) {
    pills.push(`<span class="pill pill-success">MP3 · ${t("compatible")}</span>`);
  } else if (format.includes("aac")) {
    pills.push(`<span class="pill pill-warning">AAC · ${t("risky")}</span>`);
  } else {
    pills.push(`<span class="pill pill-ghost">${t("unknownState")}</span>`);
  }

  pills.push(`<span class="pill pill-ghost">${t("streamType")}</span>`);
  return pills.join("");
}

function renderFavoritePills(item) {
  const pills = [];
  const mime = String(item.mimeType || "").toLowerCase();

  if (item.bitrate) {
    pills.push(`<span class="pill">${item.bitrate} kbps</span>`);
  }

  if (mime.includes("mpeg")) {
    pills.push(`<span class="pill pill-success">MP3 · ${t("compatible")}</span>`);
  } else if (mime.includes("aac")) {
    pills.push(`<span class="pill pill-warning">AAC · ${t("risky")}</span>`);
  } else {
    pills.push(`<span class="pill pill-ghost">${t("unknownState")}</span>`);
  }

  return pills.join("");
}

async function refreshStatus() {
  const [status, desktopState] = await Promise.all([
    api("/api/status"),
    window.desktopControls?.getServerState?.() || Promise.resolve(null)
  ]);
  renderStatus(status, desktopState);
  renderRendererStatus();
}

async function refreshDevices() {
  const result = await api("/api/discover");
  state.devices = result.devices;
  renderDevices();
  await refreshRendererStatus();
}

async function refreshTracks() {
  const result = await api("/api/library/tracks");
  state.tracks = result.items;
  renderTracks();
}

async function browseTuneIn(url = null, push = false, label = null) {
  const endpoint = url ? `/api/tunein/browse?url=${encodeURIComponent(url)}` : "/api/tunein/browse";
  const result = await api(endpoint);
  if (push && url && label) {
    state.browseStack.push({ text: label, url });
  }
  state.browseItems = result.items.filter((item) => item.type === "link" || item.type === "audio");
  renderTuneInBrowse();
}

async function refreshRendererStatus() {
  if (!state.selectedDeviceUrl) {
    state.rendererStatus = null;
    renderRendererStatus();
    return;
  }

  try {
    const result = await api(`/api/renderer/status?deviceDescriptionUrl=${encodeURIComponent(state.selectedDeviceUrl)}`);
    state.rendererStatus = result.status;
  } catch {
    state.rendererStatus = null;
  }

  renderRendererStatus();
}

async function runTuneInSearch() {
  const query = elements.tuneinQueryInput.value.trim();
  if (!query) {
    showToast(t("searchNeeded"));
    return;
  }

  const result = await api(`/api/tunein/search?q=${encodeURIComponent(query)}`);
  state.tuneinItems = result.items.filter((item) => item.actions?.play && item.key !== "radio-browser");
  renderTuneIn();
}

async function runRadioBrowserSearch() {
  const query = elements.radioBrowserQueryInput.value.trim();
  if (!query) {
    showToast(t("searchNeeded"));
    return;
  }

  const result = await api(`/api/tunein/search?q=${encodeURIComponent(query)}`);
  state.radioBrowserItems = (result.items || []).filter((item) => item.key === "radio-browser");
  renderRadioBrowser();
}

async function addFavorite(favorite, triggerButton) {
  const originalLabel = triggerButton?.textContent;

  try {
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.textContent = "...";
    }

    await api("/api/tunein/favorites", {
      method: "POST",
      body: JSON.stringify(favorite)
    });
    const result = await api("/api/tunein/favorites");
    state.favorites = result.items;
    renderFavorites();
    showToast(t("favoritesSaved"));
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Hinzufuegen fehlgeschlagen.");
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalLabel;
    }
  }
}

async function playLocal(trackId) {
  if (!state.selectedDeviceUrl) {
    showToast(t("rendererNeeded"));
    return;
  }

  await api("/api/caruso/play/local", {
    method: "POST",
    body: JSON.stringify({
      deviceDescriptionUrl: state.selectedDeviceUrl,
      trackId
    })
  });

  await refreshRendererStatus();
  showToast(t("localSent"));
}

async function playNow(item, triggerButton) {
  if (!state.selectedDeviceUrl) {
    showToast(t("rendererNeeded"));
    return;
  }

  const originalLabel = triggerButton?.textContent;

  try {
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.textContent = "...";
    }

    await api("/api/caruso/play/tunein", {
      method: "POST",
      body: JSON.stringify({
        deviceDescriptionUrl: state.selectedDeviceUrl,
        title: item.title,
        streamUrl: item.streamUrl,
        bitrate: item.bitrate,
        mimeType: item.mimeType
      })
    });
    await refreshRendererStatus();
    showToast(t("playNowStarted"));
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Play now failed.");
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalLabel;
    }
  }
}

async function addFolder(folderPath) {
  await api("/api/library/folders", {
    method: "POST",
    body: JSON.stringify({ path: folderPath })
  });
  elements.folderInput.value = "";
  await refreshStatus();
  await refreshTracks();
  showToast(t("folderAdded"));
}

elements.refreshButton.addEventListener("click", () => {
  void runWithToast(async () => {
    await Promise.all([refreshStatus(), refreshDevices(), refreshTracks()]);
  }, "Aktualisieren fehlgeschlagen.");
});

window.addEventListener("hashchange", () => {
  focusCurrentHash();
});

elements.languageSelect.addEventListener("change", () => {
  void runWithToast(async () => {
    state.language = elements.languageSelect.value === "en" ? "en" : "de";
    applyTranslations();
    renderDevices();
    renderTuneIn();
    renderRadioBrowser();
    renderFavorites();
    renderFolders();
    renderTracks();
    renderRendererStatus();
    const payload = {
      publicBaseUrl: elements.publicBaseUrlInput.value,
      rendererFilterName: elements.carusoNameInput.value,
      uiLanguage: state.language
    };
    const deezerArl = elements.deezerArlInput.value.trim();
    if (deezerArl) {
      payload.deezerArl = deezerArl;
    }

    await api("/api/config", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }, "Sprache konnte nicht gespeichert werden.");
});

elements.startServerButton.addEventListener("click", () => {
  void runWithToast(async () => {
    if (!window.desktopControls?.startServer) {
      showToast(t("startDesktopOnly"));
      return;
    }
    await window.desktopControls.startServer();
    await refreshStatus();
  }, "Server konnte nicht gestartet werden.");
});

elements.stopServerButton.addEventListener("click", () => {
  void runWithToast(async () => {
    if (!window.desktopControls?.stopServer) {
      showToast(t("stopDesktopOnly"));
      return;
    }
    await window.desktopControls.stopServer();
    await refreshStatus();
  }, "Server konnte nicht gestoppt werden.");
});

elements.configForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void runWithToast(async () => {
    const payload = {
      publicBaseUrl: elements.publicBaseUrlInput.value,
      rendererFilterName: elements.carusoNameInput.value,
      uiLanguage: state.language
    };
    const deezerArl = elements.deezerArlInput.value.trim();
    if (deezerArl) {
      payload.deezerArl = deezerArl;
    }

    await api("/api/config", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    showToast(t("configSaved"));
    await refreshStatus();
  }, "Konfiguration konnte nicht gespeichert werden.");
});

elements.discoverButton.addEventListener("click", () => {
  void runWithToast(async () => {
    await refreshDevices();
    showToast(t("rediscovered"));
  }, "UPnP-Suche fehlgeschlagen.");
});

elements.tuneinSearchButton.addEventListener("click", () => {
  void runWithToast(async () => {
    await runTuneInSearch();
  }, "TuneIn-Suche fehlgeschlagen.");
});

elements.radioBrowserSearchButton.addEventListener("click", () => {
  void runWithToast(async () => {
    await runRadioBrowserSearch();
  }, "Radio-Browser-Suche fehlgeschlagen.");
});

elements.browseRootButton.addEventListener("click", () => {
  void runWithToast(async () => {
    state.browseStack = [];
    await browseTuneIn(null, false, null);
  }, "Browse konnte nicht geladen werden.");
});

elements.browseBackButton.addEventListener("click", () => {
  void runWithToast(async () => {
    state.browseStack.pop();
    const previous = state.browseStack.at(-1);
    await browseTuneIn(previous?.url || null, false, null);
  }, "Vorheriger Browse-Schritt konnte nicht geladen werden.");
});

elements.addFolderButton.addEventListener("click", () => {
  void runWithToast(async () => {
    const folderPath = elements.folderInput.value.trim();
    if (!folderPath) {
      showToast(t("folderNeeded"));
      return;
    }
    await addFolder(folderPath);
  }, "Ordner konnte nicht hinzugefuegt werden.");
});

elements.chooseFolderButton.addEventListener("click", () => {
  void runWithToast(async () => {
    if (!window.desktopControls?.chooseFolder) {
      showToast(t("chooseDesktopOnly"));
      return;
    }
    const folderPath = await window.desktopControls.chooseFolder();
    if (folderPath) {
      elements.folderInput.value = folderPath;
    }
  }, "Ordnerauswahl fehlgeschlagen.");
});

elements.favoriteStations.addEventListener("click", (event) => {
  void runWithToast(async () => {
    const rawTarget = event.target;
    const element = rawTarget instanceof HTMLElement ? rawTarget : rawTarget?.parentElement;
    const removeButton = element?.closest("[data-remove-favorite]");

    if (!(removeButton instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const removeFavorite = decodeDataValue(removeButton.getAttribute("data-remove-favorite"));
    const removeTitle = decodeDataValue(removeButton.getAttribute("data-remove-title"));

    if (!removeFavorite) {
      showToast("Entfernen fehlgeschlagen: keine Sender-ID gefunden.");
      return;
    }

    const originalLabel = removeButton.textContent;

    try {
      removeButton.disabled = true;
      removeButton.textContent = "...";
      await api(`/api/tunein/favorites/${encodeURIComponent(removeFavorite)}?title=${encodeURIComponent(removeTitle)}`, { method: "DELETE" });
      await refreshStatus();
      showToast(t("favoriteRemoved"));
    } finally {
      removeButton.disabled = false;
      removeButton.textContent = originalLabel;
    }
  }, "Entfernen fehlgeschlagen.");
});

document.addEventListener("click", (event) => {
  void runWithToast(async () => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const actionTarget = target.closest("button, [data-select-device], [data-add-favorite], [data-remove-favorite], [data-remove-folder], [data-browse-link], [data-play-local], [data-play-now]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const selectDevice = decodeDataValue(actionTarget.getAttribute("data-select-device"));
  if (selectDevice) {
    state.selectedDeviceUrl = selectDevice;
    state.selectedDeviceName = decodeDataValue(actionTarget.getAttribute("data-select-name"));
    renderDevices();
    await refreshRendererStatus();
    return;
  }

  const browseLink = decodeDataValue(actionTarget.getAttribute("data-browse-link"));
  if (browseLink) {
    await browseTuneIn(browseLink, true, decodeDataValue(actionTarget.getAttribute("data-browse-label")) || "Browse");
    return;
  }

  const favoritePayload = actionTarget.getAttribute("data-add-favorite");
  if (favoritePayload) {
    await addFavorite(JSON.parse(decodeURIComponent(favoritePayload)), actionTarget);
    return;
  }

  const playNowPayload = actionTarget.getAttribute("data-play-now");
  if (playNowPayload) {
    await playNow(JSON.parse(decodeURIComponent(playNowPayload)), actionTarget);
    return;
  }

  const playLocalId = decodeDataValue(actionTarget.getAttribute("data-play-local"));
  if (playLocalId) {
    await playLocal(playLocalId);
    return;
  }

  const removeFolder = decodeDataValue(actionTarget.getAttribute("data-remove-folder"));
  if (removeFolder) {
    await api(`/api/library/folders?path=${encodeURIComponent(removeFolder)}`, { method: "DELETE" });
    await refreshStatus();
    await refreshTracks();
  }
  }, "Aktion fehlgeschlagen.");
});

await runWithToast(async () => {
  await Promise.all([refreshStatus(), refreshDevices(), refreshTracks(), browseTuneIn(null, false, null)]);
  renderRadioBrowser();
}, "Initiales Laden fehlgeschlagen.");

focusCurrentHash("auto");
setInterval(() => {
  void refreshRendererStatus().catch((error) => {
    console.error("Renderer-Status konnte nicht aktualisiert werden.", error);
  });
}, 5000);
