/**
 * File: server.ts
 * Purpose: API entrypoint; loads validated config and listens for HTTP.
 * Exports: (none, listens as a side effect)
 * Used by: package.json dev/start scripts
 */
import "dotenv/config";
import { createApp } from "../app.js";
import { getConfig } from "../config.js";
import { logger } from "./logger.js";

const config = getConfig();

createApp(config).listen(config.PORT, () => {
  logger.info("Stamp API listening", {
    port: config.PORT,
    agentMode: config.AGENT_MODE,
  });
  if (config.AGENT_MODE === "stub") {
    logger.warn(
      "AGENT_MODE=stub: live runs return scripted test data, not real research",
    );
  }
});
