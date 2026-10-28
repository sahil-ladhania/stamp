/**
 * File: fake-db.ts
 * Purpose: In-memory stand-in for the Prisma run and guide tables, including the unique activeSlug lock.
 * Exports: fakeDb
 * Used by: services/run-*.test.ts, services/runs.test.ts, app-runs.test.ts
 */
import { vi } from "vitest";
import { Prisma, type Run } from "../../generated/prisma/client.js";

type GuideStub = {
  slug: string;
  mode: "LIBRARY" | "LIVE";
  expiresAt?: Date | null;
};
type StoredGuide = Required<GuideStub> & { id: string } & Record<
    string,
    unknown
  >;
type RunWhere = {
  id?: string;
  status?: Run["status"];
  activeSlug?: string | { not: null };
};

function matches(run: Run, where: RunWhere): boolean {
  if (where.id !== undefined && run.id !== where.id) return false;
  if (where.status !== undefined && run.status !== where.status) return false;
  const lock = where.activeSlug;
  if (typeof lock === "string") return run.activeSlug === lock;
  if (lock !== undefined) return run.activeSlug !== null;
  return true;
}

function createFakeDb() {
  const runs = new Map<string, Run>();
  const guides = new Map<string, StoredGuide>();
  // Ids keep counting across reset() so event channels left by earlier tests never collide.
  let counter = 0;

  const addRun = (overrides: Partial<Run> & { slug: string }): Run => {
    counter += 1;
    const row: Run = {
      id: `run_${counter}`,
      status: "RUNNING",
      stageReached: null,
      errorCode: null,
      activeSlug: null,
      guideId: null,
      startedAt: new Date(),
      finishedAt: null,
      ...overrides,
    };
    runs.set(row.id, row);
    return row;
  };

  const run = {
    create: vi.fn(
      async ({ data }: { data: Partial<Run> & { slug: string } }) => {
        const taken = [...runs.values()].some(
          (r) => data.activeSlug != null && r.activeSlug === data.activeSlug,
        );
        if (taken) {
          throw new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            {
              code: "P2002",
              clientVersion: "test",
            },
          );
        }
        return addRun(data);
      },
    ),
    findUnique: vi.fn(
      async ({ where }: { where: { id?: string; activeSlug?: string } }) => {
        const row = [...runs.values()].find((r) =>
          where.id !== undefined
            ? r.id === where.id
            : r.activeSlug === where.activeSlug,
        );
        if (!row) return null;
        const guide = [...guides.values()].find((g) => g.id === row.guideId);
        return { ...row, guide: guide ? { slug: guide.slug } : null };
      },
    ),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Run>;
      }) => {
        const row = runs.get(where.id);
        if (!row) throw new Error("Record to update not found");
        return Object.assign(row, data);
      },
    ),
    updateMany: vi.fn(
      async ({ where, data }: { where: RunWhere; data: Partial<Run> }) => {
        const hits = [...runs.values()].filter((r) => matches(r, where));
        hits.forEach((r) => Object.assign(r, data));
        return { count: hits.length };
      },
    ),
    count: vi.fn(
      async ({ where }: { where: { startedAt: { gte: Date } } }) =>
        [...runs.values()].filter((r) => r.startedAt >= where.startedAt.gte)
          .length,
    ),
  };

  const guide = {
    findUnique: vi.fn(
      async ({ where }: { where: { slug: string } }) =>
        guides.get(where.slug) ?? null,
    ),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { slug: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = guides.get(where.slug);
        if (existing) return Object.assign(existing, update);
        const now = new Date();
        const row: StoredGuide = Object.assign(
          {
            id: `guide_${where.slug}`,
            slug: where.slug,
            mode: "LIVE" as const,
            expiresAt: null,
            createdAt: now,
            updatedAt: now,
          },
          create,
        );
        guides.set(where.slug, row);
        return row;
      },
    ),
  };

  return {
    runs,
    guides,
    prisma: { run, guide },
    addRun,
    addGuide: (stub: GuideStub): StoredGuide => {
      const row = { id: `guide_${stub.slug}`, expiresAt: null, ...stub };
      guides.set(stub.slug, row);
      return row;
    },
    /** Empties both tables and restores every delegate's original behaviour. */
    reset: (): void => {
      runs.clear();
      guides.clear();
      [...Object.values(run), ...Object.values(guide)].forEach((fn) =>
        fn.mockReset(),
      );
    },
  };
}

export const fakeDb = createFakeDb();
