import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "caruso-api-contracts-"));
const dataDir = path.join(tempRoot, "data");
const built = await createApp(dataDir, { loggerEnabled: false });

before(async () => {
  await built.context.storage.updateConfig({
    publicBaseUrl: "http://127.0.0.1:3847",
    rendererFilterName: "Caruso",
    deezerArl: "secret-arl"
  });
});

after(async () => {
  await built.app.close();
  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("GET /api/config redacts Deezer ARL", async () => {
  const response = await built.app.inject({
    method: "GET",
    url: "/api/config"
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.deezerArl, undefined);
  assert.equal(body.deezerConfigured, true);
});

test("GET /api/status redacts nested config secrets", async () => {
  const response = await built.app.inject({
    method: "GET",
    url: "/api/status"
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.config.deezerArl, undefined);
  assert.equal(body.config.deezerConfigured, true);
});

test("PUT /api/config preserves existing Deezer ARL when omitted", async () => {
  const response = await built.app.inject({
    method: "PUT",
    url: "/api/config",
    payload: {
      publicBaseUrl: "http://127.0.0.1:3847",
      rendererFilterName: "Living Room",
      uiLanguage: "en",
      targetPlatform: "mac"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().deezerArl, undefined);

  assert.equal((await built.context.storage.getConfig()).deezerArl, "secret-arl");
});
