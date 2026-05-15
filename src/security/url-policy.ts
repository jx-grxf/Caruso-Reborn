import dns from "node:dns/promises";
import net from "node:net";

export class UrlPolicyError extends Error {
  constructor(message: string, readonly statusCode = 400) {
    super(message);
    this.name = "UrlPolicyError";
  }
}

export function isPrivateHostname(hostname: string): boolean {
  if (hostname === "localhost") {
    return true;
  }

  const normalizedHostname = hostname.replace(/^\[|\]$/g, "");
  const ipVersion = net.isIP(normalizedHostname);

  if (ipVersion === 4) {
    const [a, b] = normalizedHostname.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (ipVersion === 6) {
    const compact = normalizedHostname.toLowerCase();
    return (
      compact === "::1" ||
      compact.startsWith("fe8") ||
      compact.startsWith("fe9") ||
      compact.startsWith("fea") ||
      compact.startsWith("feb") ||
      compact.startsWith("fc") ||
      compact.startsWith("fd")
    );
  }

  return normalizedHostname.endsWith(".local");
}

export function parseAndValidateUrl(rawValue: string, options?: {
  allowedHosts?: string[];
  allowPrivateHosts?: boolean;
  allowHostnames?: boolean;
}): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    throw new UrlPolicyError("Invalid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new UrlPolicyError("Only http and https URLs are supported.");
  }

  if (options?.allowedHosts && !options.allowedHosts.includes(parsed.hostname)) {
    throw new UrlPolicyError("URL host is not allowed.");
  }

  if (!options?.allowPrivateHosts && isPrivateHostname(parsed.hostname)) {
    throw new UrlPolicyError("Private or local network URLs are not allowed here.");
  }

  if (options?.allowHostnames === false && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname)) {
    throw new UrlPolicyError("Renderer URL must use an IPv4 address.");
  }

  return parsed;
}

export async function assertPublicHttpUrl(rawValue: string): Promise<string> {
  const parsed = parseAndValidateUrl(rawValue);
  const normalizedHostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(normalizedHostname)) {
    return parsed.toString();
  }

  let addresses: string[];
  try {
    const records = await dns.lookup(normalizedHostname, { all: true });
    addresses = records.map((record) => record.address);
  } catch {
    throw new UrlPolicyError("Could not resolve stream URL host.");
  }

  if (addresses.length === 0 || addresses.some(isPrivateHostname)) {
    throw new UrlPolicyError("Stream URL resolves to a private or local network address.");
  }

  return parsed.toString();
}
