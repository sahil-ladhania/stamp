/**
 * File: server.ts
 * Purpose: Express app entrypoint; mounts API routers and listens for HTTP.
 * Exports: (none — side-effect listen)
 * Used by: package.json dev/start scripts
 */
import express from "express";
import { errorHandler } from "../middleware/error-handler.js";
import { notFound } from "../middleware/not-found.js";
import { guidesRouter } from "../routes/guides.js";
import { healthRouter } from "../routes/health.js";
import { runsRouter } from "../routes/runs.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/runs", runsRouter);
app.use("/api/guides", guidesRouter);
app.use(notFound);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Stamp is running on port ${port}`);
});
