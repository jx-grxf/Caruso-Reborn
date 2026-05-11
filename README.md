<div align="center">

<img src="assets/brand/caruso-reborn-icon.svg" alt="Caruso Reborn app icon" width="128" height="128">

# Caruso Reborn

**Bring practical internet radio and local playback back to first-generation T+A Caruso systems**

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Terminal UI](https://img.shields.io/badge/Terminal%20UI-first-111827)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![CI](https://img.shields.io/github/actions/workflow/status/jx-grxf/Caruso-Reborn/ci.yml?branch=main&label=CI)
![Beta](https://img.shields.io/badge/macOS%20app-BETA-ff8a1c)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

T+A no longer offers a practical native internet-radio path for older Caruso devices. This project exists to bring that workflow back in a way that still feels usable today: local, self-hosted, and focused on the Caruso as it actually behaves on a home network.

Caruso Reborn turns your computer into a local terminal app, UPnP/DLNA media source, and station management dashboard so older Caruso units can browse saved stations, TuneIn categories, and local music again.

This is an independent community project and is **not affiliated with T+A**.

---

## Showcase

![Caruso Reborn dashboard showcase](docs/showcase/caruso-reborn-showcase.png)

---

## Contents

- [Showcase](#showcase)
- [Highlights](#highlights)
- [Why This Exists](#why-this-exists)
- [Scope](#scope)
- [Current Workflow](#current-workflow)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Current Status](#current-status)
- [Mac App (Beta)](#mac-app-beta)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Security and Network Notes](#security-and-network-notes)
- [Development](#development)
- [Roadmap Notes](#roadmap-notes)
- [License](#license)

---

## Highlights

| | Feature |
|---|---|
| Internet radio | TuneIn search plus Radio Browser fallback for alternate streams |
| Caruso browsing | Saved stations appear inside the Caruso UPnP tree under `TuneIn > Sender` |
| Browse mode | TuneIn root categories are exposed again through the bridge |
| Local music | User-selected folders are scanned and exposed as browsable local tracks |
| Dashboard | Web UI for device discovery, status, favorites, folders, and stream actions |
| Terminal control room | Keyboard-driven TUI with live bridge status, discovery, and quick actions |
| Network resilience | Rebinds when your computer switches between LAN and Wi-Fi |

---

## Why This Exists

Older first-generation Caruso systems can still browse UPnP/DLNA media servers on the local network, even when their original internet-radio integration is no longer useful.

The bridge uses that still-working local path instead of trying to revive the discontinued native service flow. In practice that means:

- search stations from your computer
- save working streams locally
- browse them again from the Caruso
- optionally expose local music folders from the same machine

The goal is not to re-create the original T+A backend. The goal is to restore a usable everyday listening workflow.

---

## Scope

- **macOS-first**
- **local-network only**
- **single-user / trusted-home setup**
- **built specifically around T+A Caruso behavior**
- **not a hosted service**
- **not an official T+A product**

This repo is currently a **source-first project**. A packaged macOS app is now available as a **Beta** release and should still be treated as early-access software.

---

## Current Workflow

1. Use `npm run onboard` for the guided first-run setup.
2. Use `npm run dev` for the direct terminal control room.
3. Use the packaged macOS Beta if you want the installed app path instead of running from source.
4. Keep the bridge on a trusted local network so the Caruso can reach it reliably.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| App runtime | Node.js, TypeScript |
| Server | Fastify |
| Primary shell | Terminal UI |
| UI | Vanilla HTML, CSS, JavaScript |
| Network / device control | UPnP, DLNA, SSDP, SOAP |
| Persistence | Local JSON settings in `.caruso-data` or app data |

---

## Requirements

- macOS or Windows
- Node.js `20+`
- npm
- a first-generation T+A Caruso on the same local network

Recommended:

- a stable LAN or Wi-Fi connection shared by your computer and Caruso
- a music folder if you want local file playback

---

## Current Status

Implemented and usable now:

- TuneIn search
- Radio Browser fallback search
- saved station list exposed to the Caruso
- TuneIn browse categories via UPnP
- local music folders
- renderer discovery and basic playback actions
- dashboard plus terminal control room

Still rough or incomplete:

- the packaged macOS app is available only as a **Beta**
- Deezer integration is still experimental/incomplete
- public-facing docs and screenshots are still being improved

---

## Mac App (Beta)

There is now a packaged **macOS app (Beta)** for easier local setup on Mac.

- install it from the latest GitHub release DMG
- treat the app as **Beta** and expect rough edges
- the packaged app contains the shipped code and assets only; your local `.env`, `.caruso-data`, and other personal runtime files are created on your machine at first launch and are not bundled into the DMG

If you want the most stable path, run the project from source. If you want the fastest Mac setup, use the DMG Beta.

---

## Quick Start

### First run

```bash
git clone https://github.com/jx-grxf/Caruso-Reborn.git
cd Caruso-Reborn
npm install
npm run onboard
```

This opens the guided setup wizard immediately:

- first screen: choose `Deutsch` or `English`
- then the wizard searches for your Caruso
- after setup you can open the dashboard or continue into the TUI

### Direct terminal control room

```bash
npm run dev
```

This opens the control-room TUI directly:

- `d` searches for Caruso / UPnP devices
- `b` opens the browser dashboard
- `s` starts or stops the bridge
- `q` quits cleanly

### Run from source

```bash
git clone https://github.com/jx-grxf/Caruso-Reborn.git
cd Caruso-Reborn
npm install
npm run quickstart
```

The default quickstart now goes through onboarding:

- `npm run quickstart`
- `npm run onboard`

### Server-only dev mode

```bash
npm run start
```

Dev mode still auto-selects the next free port if your preferred port is busy.

---

## Configuration

The bridge usually detects a working local network address automatically. You can still override it when needed.

Example `.env`:

```bash
PORT=3847
HOST=0.0.0.0
PUBLIC_BASE_URL=http://192.168.x.y:3847
CARUSO_FRIENDLY_NAME=Caruso on your computer
DEEZER_ARL=
DATA_DIR=/custom/path/for/app-data
```

### Important notes

- `PUBLIC_BASE_URL` must be reachable by the Caruso on your LAN
- the browser dashboard itself is loaded locally via `127.0.0.1`
- switching from LAN to Wi-Fi is supported, but the device may need a short rediscovery window
- this repo is **not** published as an npm package; `"private": true` in `package.json` is intentional to prevent accidental publish

---

## How It Works

The bridge announces itself as a UPnP/DLNA media server on your local network.

On the Caruso, you browse the bridge as a network media source and access:

- `TuneIn`
- `TuneIn > Sender`
- `TuneIn > Browse`
- `Local Music`

When you save a station from the dashboard, the bridge resolves the actual playable stream URL and stores it locally so the Caruso can browse and play it later through the UPnP tree.

---

## Usage

1. Start the app.
2. If you use `npm run onboard`, pick your language first and then choose `Mac` or `Windows` so the setup can apply platform-specific defaults.
3. Open the dashboard.
4. Let the bridge discover your Caruso renderer.
5. Search for stations with TuneIn or Radio Browser.
6. Add working stations to the saved list.
7. On the Caruso, open the UPnP/DLNA media source and browse the bridge.
8. Use `TuneIn > Sender` for saved stations or `TuneIn > Browse` for category browsing.
9. Add local music folders if you also want file-based playback.

---

## Security and Network Notes

This project is designed for **trusted local home-network use**, not for internet exposure.

- do not expose the app directly to the public internet
- keep it behind your local network
- treat `DEEZER_ARL` and any future auth tokens as sensitive
- review `.env` before publishing screenshots or logs

The repo ignores common local data and secrets such as:

- `.env`
- `.caruso-data`
- `dist`
- `.playwright-cli`

---

## Development

Useful commands:

```bash
npm run check
npm run build
npm run dev
npm run desktop
```

The repository uses:

- Conventional Commits
- branch-per-topic workflow
- PR-based changes into `main`

If you want to contribute, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Roadmap Notes

- package desktop releases for easier non-dev installation
- improve public-facing screenshots and first-run docs
- finish or remove experimental Deezer work
- extend stream validation and metadata quality indicators

---

## License

MIT

Copyright (c) Johannes Grof
