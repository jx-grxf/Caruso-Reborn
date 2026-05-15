import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type PersistedConfig = {
  publicBaseUrl?: string;
  carusoFriendlyName?: string;
  rendererFilterName?: string;
  deezerArl?: string;
  uiLanguage?: "de" | "en";
  targetPlatform?: "mac" | "windows";
};

export type TuneInFavorite = {
  id: string;
  title: string;
  streamUrl: string;
  subtitle?: string;
  image?: string;
  mimeType?: string;
  bitrate?: number;
};

type PersistedState = {
  config: PersistedConfig;
  libraryFolders: string[];
  tuneinFavorites: TuneInFavorite[];
};

const DEFAULT_STATE: PersistedState = {
  config: {},
  libraryFolders: [],
  tuneinFavorites: [
    {
      id: "ffh-die-80er",
      title: "FFH Die 80er",
      streamUrl: "http://mp3.ffh.de/ffhchannels/hq80er.mp3",
      subtitle: "Preset",
      mimeType: "audio/mpeg",
      bitrate: 128
    }
  ]
};

export class AppStorage {
  private readonly filePath: string;
  private state: PersistedState | null = null;

  constructor(private readonly dataDir: string) {
    this.filePath = path.join(this.dataDir, "settings.json");
  }

  async load(): Promise<PersistedState> {
    if (this.state) {
      return this.state;
    }

    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.state = {
        ...DEFAULT_STATE,
        ...JSON.parse(raw)
      };
      this.state!.libraryFolders = await ensureDefaultLibraryFolders(this.state!.libraryFolders);
      this.state!.tuneinFavorites = normalizeFavorites(this.state!.tuneinFavorites);
    } catch (error) {
      const isMissing = (error as NodeJS.ErrnoException).code === "ENOENT";
      this.state = isMissing ? structuredClone(DEFAULT_STATE) : DEFAULT_STATE;
      this.state.libraryFolders = await ensureDefaultLibraryFolders(this.state.libraryFolders);

      if (!isMissing) {
        throw error;
      }
    }

    return this.state!;
  }

  async getConfig(): Promise<PersistedConfig> {
    const state = await this.load();
    return state.config;
  }

  async updateConfig(nextConfig: PersistedConfig): Promise<PersistedConfig> {
    const state = await this.load();
    state.config = {
      ...state.config,
      ...nextConfig
    };
    await this.save();
    return state.config;
  }

  async getLibraryFolders(): Promise<string[]> {
    const state = await this.load();
    return [...state.libraryFolders];
  }

  async getTuneInFavorites(): Promise<TuneInFavorite[]> {
    const state = await this.load();
    return [...state.tuneinFavorites];
  }

  async addTuneInFavorite(favorite: TuneInFavorite): Promise<TuneInFavorite[]> {
    const state = await this.load();
    const normalizedFavorite = {
      ...favorite,
      title: favorite.title.trim(),
      streamUrl: favorite.streamUrl.trim()
    };
    const existingIndex = state.tuneinFavorites.findIndex((item) =>
      item.id === normalizedFavorite.id ||
      normalizeTitle(item.title) === normalizeTitle(normalizedFavorite.title)
    );

    if (existingIndex >= 0) {
      state.tuneinFavorites[existingIndex] = normalizedFavorite;
    } else {
      state.tuneinFavorites.push(normalizedFavorite);
    }

    state.tuneinFavorites = normalizeFavorites(state.tuneinFavorites);
    await this.save();
    return [...state.tuneinFavorites];
  }

  async removeTuneInFavorite(id: string): Promise<TuneInFavorite[]> {
    const state = await this.load();
    state.tuneinFavorites = state.tuneinFavorites.filter((item) => item.id !== id && normalizeTitle(item.title) !== normalizeTitle(id));
    await this.save();
    return [...state.tuneinFavorites];
  }

  async addLibraryFolder(folderPath: string): Promise<string[]> {
    const state = await this.load();
    const normalized = path.resolve(folderPath);

    if (!state.libraryFolders.includes(normalized)) {
      state.libraryFolders.push(normalized);
      state.libraryFolders.sort((left, right) => left.localeCompare(right));
      await this.save();
    }

    return [...state.libraryFolders];
  }

  async removeLibraryFolder(folderPath: string): Promise<string[]> {
    const state = await this.load();
    const normalized = path.resolve(folderPath);
    state.libraryFolders = state.libraryFolders.filter((item) => item !== normalized);
    await this.save();
    return [...state.libraryFolders];
  }

  private async save(): Promise<void> {
    if (!this.state) {
      return;
    }

    await fs.mkdir(this.dataDir, { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(this.state, null, 2), "utf8");
    await fs.rename(tempPath, this.filePath);
  }
}

function normalizeFavorites(items: TuneInFavorite[]): TuneInFavorite[] {
  const deduped = new Map<string, TuneInFavorite>();

  for (const item of items) {
    const key = normalizeTitle(item.title);
    const current = deduped.get(key);

    if (!current) {
      deduped.set(key, item);
      continue;
    }

    const preferCurrentResolved = !current.streamUrl.includes("Tune.ashx");
    const preferNextResolved = !item.streamUrl.includes("Tune.ashx");

    if (!preferCurrentResolved && preferNextResolved) {
      deduped.set(key, item);
      continue;
    }

    if (item.bitrate && (!current.bitrate || item.bitrate >= current.bitrate)) {
      deduped.set(key, { ...current, ...item });
    }
  }

  return [...deduped.values()].sort((left, right) => left.title.localeCompare(right.title));
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

async function ensureDefaultLibraryFolders(folders: string[]): Promise<string[]> {
  if (folders.length > 0) {
    return folders;
  }

  const candidates = [
    path.join(os.homedir(), "Music"),
    path.join(os.homedir(), "Music", "Music"),
    path.join(os.homedir(), "Music", "t+a")
  ];

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return [candidate];
      }
    } catch {
      continue;
    }
  }

  return folders;
}
