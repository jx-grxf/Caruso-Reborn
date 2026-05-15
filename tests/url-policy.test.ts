import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPublicHttpUrl, parseAndValidateUrl } from "../src/security/url-policy.js";
import { resolvePlayableUrl } from "../src/providers/tunein.js";

test("parseAndValidateUrl rejects private stream hosts by default", () => {
  assert.throws(
    () => parseAndValidateUrl("http://127.0.0.1:3847/audio.mp3"),
    /Private or local network URLs/
  );
});

test("parseAndValidateUrl allows explicit private renderer URLs", () => {
  const parsed = parseAndValidateUrl("http://192.168.1.50/device.xml", {
    allowPrivateHosts: true
  });

  assert.equal(parsed.hostname, "192.168.1.50");
});

test("assertPublicHttpUrl rejects DNS names that resolve to private networks", async () => {
  await assert.rejects(
    () => assertPublicHttpUrl("http://localhost/audio.mp3"),
    /Private or local network URLs/
  );
});

test("resolvePlayableUrl blocks private URLs before stream probing", async () => {
  await assert.rejects(
    () => resolvePlayableUrl("http://127.0.0.1:1/audio.mp3"),
    /Private or local network URLs/
  );
});
