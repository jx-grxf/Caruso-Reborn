import dotenv from "dotenv";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function getEnvPath(): string {
  return process.env.CARUSO_REBORN_ENV_PATH
    ? path.resolve(process.env.CARUSO_REBORN_ENV_PATH)
    : path.resolve(process.cwd(), ".env");
}

dotenv.config({ path: getEnvPath() });

const NETWORK_INTERFACE_ENV = "NETWORK_INTERFACE";
const NETWORK_ADDRESS_ENV = "NETWORK_ADDRESS";
const NETWORK_SELECTION_MODE_ENV = "NETWORK_SELECTION_MODE";
const VIRTUAL_INTERFACE_MARKERS = [
  "tailscale",
  "openvpn",
  "surfshark",
  "wireguard",
  "vmware",
  "virtualbox",
  "hyper-v",
  "loopback",
  "vethernet",
  "docker",
  "podman",
  "colima",
  "zerotier",
  "utun",
  "bridge",
  "tap",
  "tun"
];

export type NetworkSelectionMode = "automatic" | "manual";

export type NetworkCandidate = {
  interfaceName: string;
  address: string;
  baseUrl: string;
  isVirtual: boolean;
  priority: number;
};

function getRequiredNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

function isCarrierGradeNatAddress(address: string): boolean {
  return /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(address);
}

function isProbablyVirtualInterface(name: string, address: string): boolean {
  const normalizedName = name.toLowerCase();

  if (VIRTUAL_INTERFACE_MARKERS.some((marker) => normalizedName.includes(marker))) {
    return true;
  }

  return isCarrierGradeNatAddress(address);
}

function getAddressPriority(address: string): number {
  if (address.startsWith("192.168.")) {
    return 0;
  }

  if (address.startsWith("10.")) {
    return 1;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    return 2;
  }

  if (address.startsWith("100.")) {
    return 4;
  }

  return 3;
}

function getInterfacePriority(name: string, address: string): number {
  const normalizedName = name.toLowerCase();
  let priority = getAddressPriority(address) * 10;

  if (normalizedName.includes("ethernet") || normalizedName.includes("wi-fi") || normalizedName.includes("wifi") || normalizedName === "en0") {
    priority -= 2;
  }

  if (normalizedName.includes("default switch") || normalizedName.includes("nat")) {
    priority += 50;
  }

  if (isProbablyVirtualInterface(name, address)) {
    priority += 1000;
  }

  return priority;
}

function isIpv4Address(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function getConfiguredAddress(): string | undefined {
  return process.env[NETWORK_ADDRESS_ENV]?.trim() || undefined;
}

function getConfiguredInterfaceName(): string | undefined {
  return process.env[NETWORK_INTERFACE_ENV]?.trim() || undefined;
}

function getConfiguredPublicBaseUrl(): string | undefined {
  return process.env.PUBLIC_BASE_URL?.trim() || undefined;
}

function getConfiguredAddressFromPublicBaseUrl(): string | undefined {
  const configured = getConfiguredPublicBaseUrl();
  if (!configured) {
    return undefined;
  }

  try {
    const parsed = new URL(configured);
    return isIpv4Address(parsed.hostname) ? parsed.hostname : undefined;
  } catch {
    return undefined;
  }
}

export function listNetworkCandidates(port = getRequiredNumber("PORT", 3847)): NetworkCandidate[] {
  const candidates: NetworkCandidate[] = [];

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal || entry.address.startsWith("169.254.")) {
        continue;
      }

      candidates.push({
        interfaceName: name,
        address: entry.address,
        baseUrl: `http://${entry.address}:${port}`,
        isVirtual: isProbablyVirtualInterface(name, entry.address),
        priority: getInterfacePriority(name, entry.address)
      });
    }
  }

  return candidates
    .sort((left, right) => {
      const priorityDiff = left.priority - right.priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const nameDiff = left.interfaceName.localeCompare(right.interfaceName);
      if (nameDiff !== 0) {
        return nameDiff;
      }

      return left.address.localeCompare(right.address);
    })
    .filter((candidate, index, all) =>
      all.findIndex((other) => other.interfaceName === candidate.interfaceName && other.address === candidate.address) === index
    );
}

export function pickBestNetworkCandidate(candidates = listNetworkCandidates()): NetworkCandidate | undefined {
  const preferred = candidates.filter((candidate) => !candidate.isVirtual);
  return (preferred.length > 0 ? preferred : candidates)[0];
}

function resolveConfiguredCandidates(port = getRequiredNumber("PORT", 3847)): NetworkCandidate[] {
  const candidates = listNetworkCandidates(port);
  const configuredAddress = getConfiguredAddress() || getConfiguredAddressFromPublicBaseUrl();
  if (configuredAddress) {
    const matchedByAddress = candidates.filter((candidate) => candidate.address === configuredAddress);
    if (matchedByAddress.length > 0) {
      return matchedByAddress;
    }
  }

  const configuredInterfaceName = getConfiguredInterfaceName();
  if (configuredInterfaceName) {
    const matchedByInterface = candidates.filter((candidate) => candidate.interfaceName === configuredInterfaceName);
    if (matchedByInterface.length > 0) {
      return matchedByInterface;
    }
  }

  const automatic = candidates.filter((candidate) => !candidate.isVirtual);
  return automatic.length > 0 ? automatic : candidates;
}

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: getRequiredNumber("PORT", 3847),
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), ".caruso-data"),
  publicBaseUrl: getConfiguredPublicBaseUrl() || detectPublicBaseUrl(),
  networkAddresses: detectExternalIPv4Addresses(),
  carusoFriendlyName: process.env.CARUSO_FRIENDLY_NAME?.trim() || undefined,
  deezerArl: process.env.DEEZER_ARL?.trim() || undefined
};

export function detectExternalIPv4Addresses(port = getRequiredNumber("PORT", 3847)): string[] {
  return resolveConfiguredCandidates(port).map((candidate) => candidate.address);
}

export function detectPublicBaseUrl(port = getRequiredNumber("PORT", 3847)): string {
  const selected = resolveConfiguredCandidates(port)[0];
  return selected?.baseUrl || `http://127.0.0.1:${port}`;
}

export async function persistNetworkSelection(options: {
  interfaceName: string;
  address: string;
  mode: NetworkSelectionMode;
  port?: number;
}) {
  const port = options.port ?? getRequiredNumber("PORT", 3847);
  const publicBaseUrl = `http://${options.address}:${port}`;
  const envPath = getEnvPath();
  await fs.mkdir(path.dirname(envPath), { recursive: true });

  let content = "";
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const updates = new Map<string, string>([
    [NETWORK_SELECTION_MODE_ENV, options.mode],
    [NETWORK_INTERFACE_ENV, options.interfaceName],
    [NETWORK_ADDRESS_ENV, options.address],
    ["PUBLIC_BASE_URL", publicBaseUrl]
  ]);

  const lines = content.length > 0 ? content.split(/\r?\n/) : [];
  const nextLines = lines.map((line) => {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return line;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!updates.has(key)) {
      return line;
    }

    const nextValue = updates.get(key)!;
    updates.delete(key);
    return `${key}=${nextValue}`;
  });

  if (nextLines.length > 0 && nextLines.at(-1) !== "") {
    nextLines.push("");
  }

  for (const [key, value] of updates) {
    nextLines.push(`${key}=${value}`);
  }

  nextLines.push("");

  await fs.writeFile(envPath, nextLines.join("\n"), "utf8");

  process.env[NETWORK_SELECTION_MODE_ENV] = options.mode;
  process.env[NETWORK_INTERFACE_ENV] = options.interfaceName;
  process.env[NETWORK_ADDRESS_ENV] = options.address;
  process.env.PUBLIC_BASE_URL = publicBaseUrl;

  return {
    publicBaseUrl,
    interfaceName: options.interfaceName,
    address: options.address,
    mode: options.mode
  };
}

export function resolveActivePublicBaseUrl(configuredUrl?: string, port = getRequiredNumber("PORT", 3847)): string {
  const envPublicBaseUrl = getConfiguredPublicBaseUrl();
  if (envPublicBaseUrl) {
    return envPublicBaseUrl;
  }

  if (!configuredUrl?.trim()) {
    return detectPublicBaseUrl(port);
  }

  try {
    const parsed = new URL(configuredUrl);

    if (parsed.port && Number(parsed.port) !== port) {
      return detectPublicBaseUrl(port);
    }

    if (!isIpv4Address(parsed.hostname)) {
      return parsed.toString().replace(/\/$/, "");
    }

    const currentAddresses = detectExternalIPv4Addresses(port);
    if (currentAddresses.includes(parsed.hostname)) {
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return detectPublicBaseUrl(port);
  }

  return detectPublicBaseUrl(port);
}
