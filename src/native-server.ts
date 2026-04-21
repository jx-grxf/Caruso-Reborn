import { config } from "./config.js";
import { createServerManager } from "./server-manager.js";

const manager = createServerManager({
  dataDir: config.dataDir,
  loggerEnabled: false
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Caruso Reborn backend stopping (${signal})...`);

  try {
    await manager.stop();
  } finally {
    process.exit(0);
  }
}

try {
  const runtime = await manager.start();
  console.log(`Caruso Reborn backend ready on ${runtime.url}`);

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
} catch (error) {
  console.error("Caruso Reborn backend failed to start.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
