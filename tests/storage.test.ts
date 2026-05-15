import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { AppStorage } from "../src/storage.js";

test("AppStorage writes settings atomically and reloads persisted state", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "caruso-storage-"));
  try {
    const storage = new AppStorage(tempRoot);
    await storage.updateConfig({
      publicBaseUrl: "http://127.0.0.1:3847",
      rendererFilterName: "Caruso"
    });
    await storage.addTuneInFavorite({
      id: "test-station",
      title: "Test Station",
      streamUrl: "https://example.com/radio.mp3",
      mimeType: "audio/mpeg"
    });

    const raw = await fs.readFile(path.join(tempRoot, "settings.json"), "utf8");
    assert.match(raw, /Test Station/);

    const reloaded = new AppStorage(tempRoot);
    assert.equal((await reloaded.getConfig()).rendererFilterName, "Caruso");
    assert.equal((await reloaded.getTuneInFavorites()).some((item) => item.id === "test-station"), true);

    const leftovers = (await fs.readdir(tempRoot)).filter((entry) => entry.endsWith(".tmp"));
    assert.deepEqual(leftovers, []);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
