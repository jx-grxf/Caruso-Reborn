import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, "assets", "mac");
const brandDir = path.join(rootDir, "assets", "brand");
const iconsetDir = path.join(assetsDir, "CarusoReborn.iconset");
const sourceIconPath = path.join(brandDir, "caruso-reborn-icon.icon");
const brandIconPngPath = path.join(brandDir, "caruso-reborn-icon.png");
const iconPngPath = path.join(assetsDir, "icon-1024.png");
const iconIcnsPath = path.join(assetsDir, "icon.icns");
const dmgBackgroundPath = path.join(assetsDir, "dmg-background.png");
const dashboardAssetsDir = path.join(rootDir, "ui", "assets");
const dashboardIconPngPath = path.join(dashboardAssetsDir, "caruso-reborn-icon.png");

const ictoolCandidates = [
  process.env.ICTOOL_PATH,
  "/Applications/Icon Composer.app/Contents/Executables/ictool",
  "/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
].filter(Boolean);

async function findExistingFile(paths) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Keep looking for the next known Icon Composer installation path.
    }
  }

  throw new Error("Icon Composer ictool was not found. Install Icon Composer or set ICTOOL_PATH.");
}

const ictoolPath = await findExistingFile(ictoolCandidates);

const dmgBackgroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1360" height="880" viewBox="0 0 1360 880">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#09101a" />
      <stop offset="50%" stop-color="#10192b" />
      <stop offset="100%" stop-color="#070c14" />
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
    </linearGradient>
  </defs>

  <rect width="1360" height="880" fill="url(#bg)" />
  <circle cx="150" cy="150" r="260" fill="#1bc1d6" opacity="0.16" />
  <circle cx="1240" cy="770" r="220" fill="#ff6a2a" opacity="0.18" />
  <rect x="86" y="120" width="1188" height="640" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" />

  <text x="120" y="220" fill="#ffffff" font-size="78" font-family="Avenir Next, SF Pro Display, Helvetica Neue, Arial" font-weight="700">
    Caruso Reborn Beta
  </text>
  <text x="120" y="282" fill="rgba(255,255,255,0.72)" font-size="30" font-family="Avenir Next, SF Pro Text, Helvetica Neue, Arial" font-weight="500">
    Beta macOS app. Drop it into Applications to install your local Caruso control room.
  </text>
  <text x="120" y="678" fill="#92f7ff" font-size="28" font-family="Avenir Next, SF Pro Text, Helvetica Neue, Arial" font-weight="600">
    1. Open    2. Drag to Applications    3. Launch from the menu bar
  </text>
</svg>
`.trim();

const iconsetSizes = [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024]
];

await fs.rm(iconsetDir, { recursive: true, force: true });
await fs.mkdir(iconsetDir, { recursive: true });
await fs.mkdir(dashboardAssetsDir, { recursive: true });

execFileSync(ictoolPath, [
  sourceIconPath,
  "--export-image",
  "--output-file",
  iconPngPath,
  "--platform",
  "macOS",
  "--rendition",
  "Default",
  "--width",
  "1024",
  "--height",
  "1024",
  "--scale",
  "1"
], {
  stdio: "inherit"
});

await sharp(iconPngPath)
  .png()
  .toFile(brandIconPngPath);

await sharp(iconPngPath)
  .resize(512, 512)
  .png()
  .toFile(dashboardIconPngPath);

await sharp(Buffer.from(dmgBackgroundSvg))
  .png()
  .toFile(dmgBackgroundPath);

for (const [fileName, size] of iconsetSizes) {
  await sharp(iconPngPath)
    .resize(size, size)
    .png()
    .toFile(path.join(iconsetDir, fileName));
}

execFileSync("/usr/bin/iconutil", ["-c", "icns", iconsetDir, "-o", iconIcnsPath], {
  stdio: "inherit"
});
