/**
 * File: prisma.ts
 * Purpose: Single PrismaClient for the API, wired to MySQL via the MariaDB driver adapter.
 * Exports: prisma
 * Used by: services (runs, guides, reports, page-cache)
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getConfig } from "../config.js";
import { PrismaClient } from "../../generated/prisma/client.js";

const CONNECTION_LIMIT = 5;

/** Splits DATABASE_URL into pool options so the connection limit can be set. */
function poolConfigFrom(
  databaseUrl: string,
): ConstructorParameters<typeof PrismaMariaDb>[0] {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: CONNECTION_LIMIT,
  };
}

const adapter = new PrismaMariaDb(poolConfigFrom(getConfig().DATABASE_URL));

/** Shared database client for Express routes and services. */
export const prisma = new PrismaClient({ adapter });
