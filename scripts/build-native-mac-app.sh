#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Caruso Reborn"
PACKAGE_PATH="$ROOT_DIR/native-mac/CarusoRebornMac"
BUILD_ROOT="$ROOT_DIR/native-mac/build"
BACKEND_STAGE="$BUILD_ROOT/backend-stage"
APP_BUNDLE="$BUILD_ROOT/$APP_NAME.app"
DMG_STAGE="$BUILD_ROOT/dmg"
OUTPUT_DIR="$ROOT_DIR/release/native-mac"
ICON_PATH="$ROOT_DIR/assets/mac/icon.icns"
NODE_VERSION="${CARUSO_REBORN_NODE_VERSION:-$(node -p "process.version")}"
ARCH_NAME="$(uname -m)"
if [[ "$ARCH_NAME" == "x86_64" ]]; then
  NODE_ARCH="x64"
else
  NODE_ARCH="arm64"
fi
NODE_DIST="node-${NODE_VERSION}-darwin-${NODE_ARCH}"
NODE_CACHE_DIR="$BUILD_ROOT/node-runtime"
NODE_ARCHIVE="$NODE_CACHE_DIR/${NODE_DIST}.tar.gz"
NODE_EXTRACTED="$NODE_CACHE_DIR/$NODE_DIST"
mkdir -p "$BUILD_ROOT" "$OUTPUT_DIR"
rm -rf "$BACKEND_STAGE" "$APP_BUNDLE" "$DMG_STAGE"

echo "==> Backend bauen"
cd "$ROOT_DIR"
npm run build

echo "==> SwiftUI-App bauen"
swift build --package-path "$PACKAGE_PATH" -c release
BIN_PATH="$(swift build --package-path "$PACKAGE_PATH" -c release --show-bin-path)"

echo "==> Laufzeit-Backend vorbereiten"
mkdir -p "$BACKEND_STAGE"
cp package.json package-lock.json "$BACKEND_STAGE/"
cp -R dist ui "$BACKEND_STAGE/"
(cd "$BACKEND_STAGE" && npm ci --omit=dev)

echo "==> Offizielle Node-Runtime laden"
mkdir -p "$NODE_CACHE_DIR"
if [[ ! -x "$NODE_EXTRACTED/bin/node" ]]; then
  rm -rf "$NODE_EXTRACTED" "$NODE_ARCHIVE"
  curl -L -o "$NODE_ARCHIVE" "https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIST}.tar.gz"
  tar -xzf "$NODE_ARCHIVE" -C "$NODE_CACHE_DIR"
fi

echo "==> App-Bundle erzeugen"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources/runtime/bin"
cp "$BIN_PATH/CarusoRebornMac" "$APP_BUNDLE/Contents/MacOS/CarusoReborn"
chmod +x "$APP_BUNDLE/Contents/MacOS/CarusoReborn"
cp -R "$BACKEND_STAGE" "$APP_BUNDLE/Contents/Resources/backend"
cp "$NODE_EXTRACTED/bin/node" "$APP_BUNDLE/Contents/Resources/runtime/bin/node"
chmod +x "$APP_BUNDLE/Contents/Resources/runtime/bin/node"

if [[ -f "$ICON_PATH" ]]; then
  cp "$ICON_PATH" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"
fi

cat > "$APP_BUNDLE/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>de</string>
  <key>CFBundleDisplayName</key>
  <string>Caruso Reborn</string>
  <key>CFBundleExecutable</key>
  <string>CarusoReborn</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>com.jxgrxf.carusoreborn.native</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Caruso Reborn</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.2.1</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.music</string>
  <key>LSMinimumSystemVersion</key>
  <string>14.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
</dict>
</plist>
PLIST

if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_BUNDLE"
fi

echo "==> DMG bauen"
mkdir -p "$DMG_STAGE"
cp -R "$APP_BUNDLE" "$DMG_STAGE/"
ln -s /Applications "$DMG_STAGE/Applications"
rm -f "$OUTPUT_DIR/Caruso-Reborn.dmg"
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$DMG_STAGE" \
  -ov \
  -format UDZO \
  "$OUTPUT_DIR/Caruso-Reborn.dmg" >/dev/null

echo
echo "App: $APP_BUNDLE"
echo "DMG: $OUTPUT_DIR/Caruso-Reborn.dmg"
