/**
 * File: server.ts
 * Purpose: API entrypoint; loads validated config and listens for HTTP.
 * Exports: (none — side-effect listen)
 * Used by: package.json dev/start scripts
 */
import "dotenv/config";
import { createApp } from "../app.js";
import { getConfig } from "../config.js";
import { logger } from "./logger.js";

const config = getConfig();

createApp(config).listen(config.PORT, () => {
  logger.info("Stamp API listening", { port: config.PORT });
});
