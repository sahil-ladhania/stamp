/**
 * File: library-seed.test.ts
 * Purpose: Tests seeding library guides: library rows that never expire, columns synced from the guide, safe to run twice, a live row replaced, and nothing written when a guide is invalid.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { libraryGuide } from "../library/fixtures/library-guide.js";

const guide = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock("../lib/prisma.js", () => ({ prisma: { guide } }));

const { seedLibraryGuides } = await import("./library-seed.js");

const notion = libraryGuide({
  slug: "notion",
  appName: "Notion",
  domain: "notion.so",
  archetype: "unknown",
  difficulty: 2,
});
const slack = libraryGuide({
  slug: "slack",
  appName: "Slack",
  domain: "slack.com",
});

beforeEach(() => {
  guide.findUnique.mockReset().mockResolvedValue(null);
  guide.upsert.mockReset().mockResolvedValue({});
});

describe("seedLibraryGuides", () => {
  it("upserts each guide by slug as a library row that never expires, with the columns taken from the guide", async () => {
    expect(await seedLibraryGuides([notion])).toEqual([
      { slug: "notion", action: "created" },
    ]);
    const call = guide.upsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ slug: "notion" });
    expect(call.create).toMatchObject({
      slug: "notion",
      appName: "Notion",
      domain: "notion.so",
      mode: "LIBRARY",
      archetype: "UNKNOWN",
      difficulty: 2,
      asOf: new Date(notion.asOf),
      expiresAt: null,
    });
    expect(call.update.mode).toBe("LIBRARY");
    expect(call.create.data).toEqual({ ...notion, mode: "library" });
  });

  it("makes the same calls when run a second time, and says the row was updated", async () => {
    await seedLibraryGuides([notion]);
    guide.findUnique.mockResolvedValue({ mode: "LIBRARY" });
    expect(await seedLibraryGuides([notion])).toEqual([
      { slug: "notion", action: "updated" },
    ]);
    expect(guide.upsert.mock.calls[1]).toEqual(guide.upsert.mock.calls[0]);
  });

  it("replaces a live guide with the same slug and says so", async () => {
    guide.findUnique.mockResolvedValue({ mode: "LIVE" });
    expect(await seedLibraryGuides([slack])).toEqual([
      { slug: "slack", action: "replaced_live" },
    ]);
    expect(guide.upsert.mock.calls[0]?.[0].update.mode).toBe("LIBRARY");
  });

  it("writes nothing when any guide is invalid", async () => {
    const broken = { ...slack, asOf: "not a date" };
    await expect(seedLibraryGuides([notion, broken])).rejects.toThrow();
    expect(guide.upsert).not.toHaveBeenCalled();
  });
});
