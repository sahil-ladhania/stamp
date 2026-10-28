/**
 * File: guide-save.test.ts
 * Purpose: Tests saving live guides: column sync, 7-day expiry, library protection, validation.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema, type Guide } from "@stamp/schema";
import { ZodError } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InternalError } from "../errors/app-error.js";
import { sampleGuideRow } from "../mappers/fixtures/sample-guide-row.js";

const guide = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock("../lib/prisma.js", () => ({ prisma: { guide } }));

const { LIVE_GUIDE_TTL_MS, saveLiveGuide } = await import("./guide-save.js");

const now = new Date("2026-03-05T10:00:00.000Z");
const base = GuideSchema.parse(sampleGuideRow().data);
const liveGuide: Guide = {
  ...base,
  slug: "notion",
  appName: "Notion",
  domain: "notion.so",
  mode: "live",
  archetype: "instant",
  difficulty: 2,
};

beforeEach(() => {
  guide.findUnique.mockReset().mockResolvedValue(null);
  guide.upsert.mockReset().mockResolvedValue({});
});

describe("saveLiveGuide", () => {
  it("upserts a live guide and syncs the indexed columns from the guide", async () => {
    expect(await saveLiveGuide(liveGuide, now)).toEqual({ saved: true });
    const call = guide.upsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ slug: "notion" });
    expect(call.create).toMatchObject({
      slug: "notion",
      appName: "Notion",
      domain: "notion.so",
      mode: "LIVE",
      archetype: "INSTANT",
      difficulty: 2,
      asOf: new Date(liveGuide.asOf),
    });
    expect(call.update.archetype).toBe("INSTANT");
    expect(call.create.data).toEqual({ ...liveGuide, mode: "live" });
  });

  it("expires the guide 7 days after it was saved", async () => {
    await saveLiveGuide(liveGuide, now);
    const call = guide.upsert.mock.calls[0]?.[0];
    expect(call.create.expiresAt.getTime() - now.getTime()).toBe(
      LIVE_GUIDE_TTL_MS,
    );
    expect(LIVE_GUIDE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("always stores the guide as live, whatever mode it arrives with", async () => {
    await saveLiveGuide({ ...liveGuide, mode: "library" }, now);
    expect(guide.upsert.mock.calls[0]?.[0].create.mode).toBe("LIVE");
    expect(guide.upsert.mock.calls[0]?.[0].create.data.mode).toBe("live");
  });

  it("refreshes an existing live guide", async () => {
    guide.findUnique.mockResolvedValue({ mode: "LIVE" });
    expect(await saveLiveGuide(liveGuide, now)).toEqual({ saved: true });
    expect(guide.upsert).toHaveBeenCalledTimes(1);
  });

  it("never overwrites a library guide", async () => {
    guide.findUnique.mockResolvedValue({ mode: "LIBRARY" });
    expect(await saveLiveGuide({ ...liveGuide, slug: "hubspot" }, now)).toEqual(
      {
        saved: false,
        reason: "library_guide_protected",
      },
    );
    expect(guide.upsert).not.toHaveBeenCalled();
  });

  it("rejects a guide that fails the shared schema, without touching the database", async () => {
    const broken = { ...liveGuide, difficulty: 9 } as Guide;
    await expect(saveLiveGuide(broken, now)).rejects.toBeInstanceOf(ZodError);
    expect(guide.findUnique).not.toHaveBeenCalled();
    expect(guide.upsert).not.toHaveBeenCalled();
  });

  it("rejects an asOf that is not a date", async () => {
    await expect(
      saveLiveGuide({ ...liveGuide, asOf: "yesterday" }, now),
    ).rejects.toBeInstanceOf(InternalError);
    expect(guide.upsert).not.toHaveBeenCalled();
  });
});
