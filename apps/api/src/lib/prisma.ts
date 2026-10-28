/**
 * File: prisma.ts
 * Purpose: Single PrismaClient for the API, wired to MySQL via the MariaDB driver adapter.
 * Exports: prisma
 * Used by: services (runs, guides, reports, page-cache)
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaMariaDb(databaseUrl, {
  connectionLimit: 5,
});

/** Shared database client for Express routes and services. */
export const prisma = new PrismaClient({ adapter });
