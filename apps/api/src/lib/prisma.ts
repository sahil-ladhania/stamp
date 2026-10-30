/**
 * File: prisma.ts
 * Purpose: Single PrismaClient for the API, wired to MySQL via the MariaDB driver adapter (TLS when DATABASE_URL asks for it).
 * Exports: prisma
 * Used by: services (runs, guides, reports, page-cache)
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getDatabaseConfig } from "../config.js";
import { PrismaClient } from "../../generated/prisma/client.js";
import { poolConfigFrom } from "./db-pool-config.js";
import { logger } from "./logger.js";

const { DATABASE_URL, DB_SSL_CA } = getDatabaseConfig();
const { config, tls } = poolConfigFrom(DATABASE_URL, DB_SSL_CA);
// Says how the database connection is secured, so a refused certificate is easy to read in the logs.
logger.info("database connection", { host: config.host, tls });

const adapter = new PrismaMariaDb(config);

/** Shared database client for Express routes and services. */
export const prisma = new PrismaClient({ adapter });
