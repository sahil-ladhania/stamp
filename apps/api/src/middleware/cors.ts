/**
 * File: cors.ts
 * Purpose: CORS policy that allows only the web app's origin (WEB_ORIGIN).
 * Exports: corsMiddleware
 * Used by: app.ts
 */
import cors from "cors";
import type { RequestHandler } from "express";

const PREFLIGHT_MAX_AGE_SECONDS = 600;

/** Allows GET and POST from one origin; exposes Retry-After so the web app can read rate limits. */
export function corsMiddleware(webOrigin: string): RequestHandler {
  return cors({
    // A browser's Origin has no trailing slash, so a pasted "https://app.example.com/" must still match.
    origin: webOrigin.replace(/\/+$/, ""),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: ["Retry-After"],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  });
}
