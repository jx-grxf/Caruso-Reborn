#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsxCliPath = require.resolve("tsx/cli");
const rootDir = fileURLToPath(new URL("..", import.meta.url));

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log("taclient [command]");
  console.log("");
  console.log("Commands:");
  console.log("  start      Start the terminal UI (default)");
  console.log("  onboard    Start the guided onboarding");
  console.log("  help       Show this help");
}

const entryByCommand = {
  start: "src/index.ts",
  onboard: "src/onboard.ts"
};

if (command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const selectedEntry = entryByCommand[command] ?? "src/index.ts";
const forwardedArgs = entryByCommand[command] ? args.slice(1) : args;

if (command && !entryByCommand[command] && forwardedArgs.length === args.length && command.startsWith("-") === false) {
  console.error(`Unknown command: ${command}`);
  console.error("Use 'taclient help' to see available commands.");
  process.exit(1);
}

const child = spawn(process.execPath, [tsxCliPath, selectedEntry, ...forwardedArgs], {
  cwd: path.resolve(rootDir),
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
