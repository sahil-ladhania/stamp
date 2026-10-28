/**
 * File: guides.test.ts
 * Purpose: Tests guide list and read against a mocked Prisma client.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app-error.js";
import { sampleGuideRow } from "../mappers/fixtures/sample-guide-row.js";

const guide = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn() }));
vi.mock("../lib/prisma.js", () => ({ prisma: { guide } }));

const { getGuideBySlug, listGuides } = await import("./guides.js");

beforeEach(() => {
  guide.findMany.mockReset();
  guide.findUnique.mockReset();
});

describe("listGuides", () => {
  it("lists only library guides, easiest first, without loading guide JSON", async () => {
    guide.findMany.mockResolvedValue([sampleGuideRow()]);
    const summaries = await listGuides();
    const query = guide.findMany.mock.calls[0]?.[0];
    expect(query.where).toEqual({ mode: "LIBRARY" });
    expect(query.orderBy).toEqual([{ difficulty: "asc" }, { appName: "asc" }]);
    expect(query.select.data).toBeUndefined();
    expect(summaries).toEqual([
      {
        slug: "hubspot",
        appName: "HubSpot",
        archetype: "hidden_limits",
        difficulty: 3,
        mode: "library",
        asOf: "2026-01-15T00:00:00.000Z",
      },
    ]);
  });

  it("returns an empty list when no library guide is stored", async () => {
    guide.findMany.mockResolvedValue([]);
    expect(await listGuides()).toEqual([]);
  });
});

describe("getGuideBySlug", () => {
  it("returns the validated guide for a slug", async () => {
    guide.findUnique.mockResolvedValue(sampleGuideRow());
    const result = await getGuideBySlug("hubspot");
    expect(guide.findUnique).toHaveBeenCalledWith({
      where: { slug: "hubspot" },
    });
    expect(result.slug).toBe("hubspot");
    expect(result.mode).toBe("library");
  });

  it("throws NotFoundError for an unknown slug", async () => {
    guide.findUnique.mockResolvedValue(null);
    await expect(getGuideBySlug("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("still returns a live guide whose cache window has expired", async () => {
    guide.findUnique.mockResolvedValue(
      sampleGuideRow({ mode: "LIVE", expiresAt: new Date("2020-01-01") }),
    );
    const result = await getGuideBySlug("hubspot");
    expect(result.mode).toBe("live");
  });
});
