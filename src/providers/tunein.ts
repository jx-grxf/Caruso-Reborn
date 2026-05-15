import { XMLParser } from "fast-xml-parser";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fetch } from "undici";
import { assertPublicHttpUrl } from "../security/url-policy.js";

export type TuneInStation = {
  type: string;
  text: string;
  subtext?: string;
  image?: string;
  guideId?: string;
  bitrate?: number;
  formats?: string;
  key?: string;
  actions?: {
    play?: string;
    browse?: string;
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

const STREAM_HEADERS = {
  "user-agent": "CarusoReborn/0.2.0",
  "accept": "audio/mpeg,audio/aac,audio/*,*/*;q=0.8"
};

const BROWSE_CACHE_TTL_MS = 2 * 60 * 1000;
const browseCache = new Map<string, { expiresAt: number; items: TuneInStation[] }>();
const execFileAsync = promisify(execFile);
const CURL_META_MARKER = "__CARUSO_CURL_META__";

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export async function searchStations(query: string): Promise<TuneInStation[]> {
  const url = new URL("https://opml.radiotime.com/Search.ashx");
  url.searchParams.set("query", query);
  url.searchParams.set("render", "xml");

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`TuneIn search failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    opml?: {
      body?: {
        outline?: Array<Record<string, string>> | Record<string, string>;
      };
    };
  };

  return toArray(parsed.opml?.body?.outline)
    .filter((item) => item.type === "audio" || item.type === "link")
    .map(mapOutlineToStation);
}

export async function browseDirectory(inputUrl = "https://opml.radiotime.com/Browse.ashx?render=xml"): Promise<TuneInStation[]> {
  const cached = browseCache.get(inputUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.items;
  }

  const response = await fetch(inputUrl, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`TuneIn browse failed with status ${response.status}.`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    opml?: {
      body?: {
        outline?: Array<Record<string, string>> | Record<string, string>;
      };
    };
  };

  const items = toArray(parsed.opml?.body?.outline).map(mapOutlineToStation);
  browseCache.set(inputUrl, {
    expiresAt: Date.now() + BROWSE_CACHE_TTL_MS,
    items
  });
  return items;
}

export async function inspectStream(inputUrl: string): Promise<{
  resolvedUrl: string;
  mimeType: string;
}> {
  const resolvedUrl = await resolvePlayableUrl(inputUrl);
  const probe = await probeStream(resolvedUrl);
  const mimeType = normalizeMimeType(probe.contentType || guessMimeTypeFromUrl(probe.finalUrl || resolvedUrl));

  return {
    resolvedUrl: probe.finalUrl || resolvedUrl,
    mimeType
  };
}

function mapOutlineToStation(item: Record<string, string>): TuneInStation {
  return {
      type: item.type ?? "unknown",
      text: item.text ?? "Unknown",
      subtext: item.subtext,
      image: item.image,
      guideId: item.guide_id,
      bitrate: item.bitrate ? Number(item.bitrate) : undefined,
      formats: item.formats,
      key: item.key,
      actions: {
        play: item.URL,
        browse: item.BrowseURL
      }
    };
}

export async function resolvePlayableUrl(inputUrl: string, depth = 0): Promise<string> {
  if (depth > 5) {
    throw new Error("TuneIn stream lookup exceeded redirect depth.");
  }

  const safeInputUrl = await assertPublicHttpUrl(inputUrl);
  const probe = await probeStream(safeInputUrl);
  const finalUrl = await assertPublicHttpUrl(probe.finalUrl || safeInputUrl);
  if (isAudioContentType(probe.contentType)) {
    return finalUrl;
  }

  if (looksLikeDirectAudioUrl(finalUrl)) {
    return finalUrl;
  }

  const response = await fetchTextProbe(finalUrl);
  const text = response.body || "";
  const firstStreamUrl = extractFirstStreamUrl(text, finalUrl);
  if (firstStreamUrl) {
    return resolvePlayableUrl(firstStreamUrl, depth + 1);
  }

  return finalUrl;
}

function guessMimeTypeFromUrl(url: string): string {
  if (url.endsWith(".aac")) {
    return "audio/aac";
  }

  if (url.endsWith(".flac")) {
    return "audio/flac";
  }

  return "audio/mpeg";
}

async function probeStream(inputUrl: string): Promise<{ finalUrl: string; contentType: string }> {
  const safeInputUrl = await assertPublicHttpUrl(inputUrl);

  try {
    const headResponse = await fetch(safeInputUrl, {
      method: "HEAD",
      headers: STREAM_HEADERS,
      signal: AbortSignal.timeout(10000)
    }).catch(() => null);

    if (headResponse?.ok) {
      const headContentType = headResponse.headers.get("content-type") || "";
      if (headContentType && !isClearlyHtmlLike(headContentType)) {
        return {
          finalUrl: await assertPublicHttpUrl(headResponse.url || safeInputUrl),
          contentType: headContentType
        };
      }
    }

    const getResponse = await fetch(safeInputUrl, {
      headers: STREAM_HEADERS,
      signal: AbortSignal.timeout(10000)
    });
    const contentType = getResponse.headers.get("content-type") || "";
    const finalUrl = await assertPublicHttpUrl(getResponse.url || safeInputUrl);
    await getResponse.body?.cancel().catch(() => undefined);

    return {
      finalUrl,
      contentType
    };
  } catch (error) {
    if (!shouldUseCurlFallback(error)) {
      throw error;
    }

    return fetchCurlProbe(safeInputUrl);
  }
}

async function fetchTextProbe(inputUrl: string): Promise<{ finalUrl: string; contentType: string; body: string }> {
  const safeInputUrl = await assertPublicHttpUrl(inputUrl);

  try {
    const response = await fetch(safeInputUrl, {
      headers: STREAM_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`TuneIn stream lookup failed with status ${response.status}.`);
    }

    return {
      finalUrl: await assertPublicHttpUrl(response.url || safeInputUrl),
      contentType: response.headers.get("content-type") || "",
      body: await response.text()
    };
  } catch (error) {
    if (!shouldUseCurlFallback(error)) {
      throw error;
    }

    return fetchCurlBody(safeInputUrl);
  }
}

async function fetchCurlProbe(inputUrl: string): Promise<{ finalUrl: string; contentType: string }> {
  const safeInputUrl = await assertPublicHttpUrl(inputUrl);
  const { stdout } = await execFileAsync("curl", [
    "-fsSL",
    "--max-time",
    "10",
    "-A",
    STREAM_HEADERS["user-agent"],
    "-H",
    `accept: ${STREAM_HEADERS.accept}`,
    "-D",
    "-",
    "-o",
    "/dev/null",
    "-w",
    `\n${CURL_META_MARKER}%{url_effective}\t%{content_type}`,
    safeInputUrl
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 });

  const meta = extractCurlMeta(stdout);
  return {
    finalUrl: await assertPublicHttpUrl(meta.finalUrl || safeInputUrl),
    contentType: meta.contentType || ""
  };
}

async function fetchCurlBody(inputUrl: string): Promise<{ finalUrl: string; contentType: string; body: string }> {
  const safeInputUrl = await assertPublicHttpUrl(inputUrl);
  const { stdout } = await execFileAsync("curl", [
    "-fsSL",
    "--max-time",
    "10",
    "-A",
    STREAM_HEADERS["user-agent"],
    "-H",
    `accept: ${STREAM_HEADERS.accept}`,
    "-w",
    `\n${CURL_META_MARKER}%{url_effective}\t%{content_type}`,
    safeInputUrl
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 * 2 });

  const meta = extractCurlMeta(stdout);
  return {
    finalUrl: await assertPublicHttpUrl(meta.finalUrl || safeInputUrl),
    contentType: meta.contentType || "",
    body: meta.body
  };
}

function extractCurlMeta(stdout: string): { finalUrl: string; contentType: string; body: string } {
  const markerIndex = stdout.lastIndexOf(CURL_META_MARKER);
  if (markerIndex === -1) {
    return {
      finalUrl: "",
      contentType: "",
      body: stdout
    };
  }

  const body = stdout.slice(0, markerIndex).trimEnd();
  const metaLine = stdout.slice(markerIndex + CURL_META_MARKER.length).trim();
  const [finalUrl = "", contentType = ""] = metaLine.split("\t");

  return {
    finalUrl: finalUrl.trim(),
    contentType: contentType.trim(),
    body
  };
}

function shouldUseCurlFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return Boolean(
    message.includes("fetch failed") ||
    message.includes("http/1.1 protocol") ||
    message.includes("missing expected cr") ||
    message.includes("socket hang up") ||
    message.includes("other side closed")
  );
}

function normalizeMimeType(value: string): string {
  return value.split(";")[0]?.trim().toLowerCase() || "audio/mpeg";
}

function isClearlyHtmlLike(contentType: string): boolean {
  const normalized = normalizeMimeType(contentType);
  return normalized === "text/html" || normalized === "text/plain" || normalized === "application/xhtml+xml";
}

function isAudioContentType(contentType: string): boolean {
  const normalized = normalizeMimeType(contentType);
  if (normalized === "audio/x-mpegurl" || normalized === "audio/mpegurl") {
    return false;
  }

  return normalized.startsWith("audio/") || normalized === "application/octet-stream";
}

function looksLikeDirectAudioUrl(url: string): boolean {
  return /\.(mp3|aac|m4a|flac|ogg|opus)(?:$|\?)/i.test(url);
}

function extractFirstStreamUrl(text: string, baseUrl: string): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("#")) {
      continue;
    }

    const plsMatch = line.match(/^File\d+=(.+)$/i);
    const candidate = plsMatch?.[1] || line.match(/https?:\/\/[^\s"'<>]+/i)?.[0] || line.match(/href="([^"]+)"/i)?.[1];
    if (!candidate) {
      continue;
    }

    try {
      return new URL(candidate, baseUrl).toString();
    } catch {
      continue;
    }
  }

  return undefined;
}
