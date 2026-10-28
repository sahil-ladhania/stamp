/**
 * File: probe-skipped.test.ts
 * Purpose: Tests when the probe stage sends nothing (kill switch, no authorize URL, refused target) and how long it lets the request take.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim } from "@stamp/schema";
import { lookup } from "node:dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { createHarness, trace } from "../../test-support/graph-harness.js";
import {
  claims,
  probe,
  quoting,
} from "../../test-support/probe-node-helpers.js";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
const dns = vi.mocked(lookup);
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
vi.spyOn(logger, "info").mockImplementation(() => {});

const answer = (
  status: number,
  body = "",
  headers: Record<string, string> = {},
) => fetchMock.mockResolvedValue(new Response(body, { status, headers }));

beforeEach(() => {
  fetchMock.mockReset();
  dns
    .mockReset()
    .mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
});

describe("probeNode: when it does not probe", () => {
  it("does nothing when AGENT_PROBE is off, but the stage still runs", async () => {
    const h = createHarness();
    h.deps.probeEnabled = false;
    const { update } = await probe({}, h);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dns).not.toHaveBeenCalled();
    expect(update).toEqual({ completed: [6] });
    expect(trace(h.events)).toEqual(["stage.started:6", "stage.done:6"]);
  });

  it("does nothing when no Sourced claim quotes an authorize URL", async () => {
    const { update } = await probe({ claims: [claims[1] as Claim] });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(update.probeResult).toBeUndefined();
  });

  it("does nothing when the only claim quoting the URL is Uncertain", async () => {
    await probe({ claims: [claims[3] as Claim] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not probe a URL outside the official domain, whatever the claim says", async () => {
    await probe({
      claims: [
        quoting(
          "steps.0.detail",
          "Go to https://evil.example.net/oauth/authorize now.",
        ),
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing with no claims, as after a budget stop", async () => {
    await probe({ claims: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("probeNode: the time limit", () => {
  it("allows the request 3 seconds when the stage has time", async () => {
    answer(400, "invalid_client");
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await probe();
    expect(timeout).toHaveBeenCalledWith(3_000);
    timeout.mockRestore();
  });

  it("allows less when the run has less time left", async () => {
    answer(400, "invalid_client");
    const h = createHarness();
    h.setRemaining(1_600);
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await probe({}, h);
    expect(timeout.mock.calls[0]?.[0]).toBeLessThanOrEqual(1_600);
    timeout.mockRestore();
  });
});
