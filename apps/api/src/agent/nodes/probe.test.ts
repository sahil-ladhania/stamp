/**
 * File: probe.test.ts
 * Purpose: Tests the probe stage with a mocked fetch and DNS: the upgrade to Tested, and failures that change nothing.
 * Exports: (none)
 * Used by: vitest
 */
import { lookup } from "node:dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { trace } from "../../test-support/graph-harness.js";
import {
  AUTH,
  claims,
  labels,
  probe,
} from "../../test-support/probe-node-helpers.js";
import { readyState } from "../../test-support/save-helpers.js";

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

describe("probeNode: a passing probe", () => {
  it("upgrades the Sourced claims that quote the authorize URL to Tested, and no others", async () => {
    answer(400, '{"error":"invalid_client"}');
    const { update } = await probe();
    expect(labels(update)).toEqual({
      "steps.0.detail": "tested",
      "limits.0": "sourced",
      "requirements.0": "tested",
      "scopes.0.reason": "uncertain",
    });
    expect(update.probeResult).toEqual({
      url: AUTH,
      outcome: "passed",
      status: 400,
      reason: "client_rejected",
    });
  });

  it("upgrades on a 3xx to a login page on the official domain", async () => {
    answer(302, "", { location: "https://acme.com/login" });
    expect(labels((await probe()).update)["steps.0.detail"]).toBe("tested");
  });

  it("logs one PROBE row per upgraded claim after the existing checks", async () => {
    answer(403, "invalid_client");
    const before = readyState({ claims }).checks;
    const { update } = await probe();
    const checks = update.checks as {
      claimId: string;
      method: string;
      result: string;
      sourceUrl: string | null;
      detail: object;
    }[];
    expect(checks.slice(0, before.length)).toEqual(before);
    expect(checks.slice(before.length)).toEqual([
      {
        claimId: "steps.0.detail",
        method: "probe",
        result: "pass",
        detail: { reason: "client_rejected", status: 403 },
        sourceUrl: AUTH,
      },
      {
        claimId: "requirements.0",
        method: "probe",
        result: "pass",
        detail: { reason: "client_rejected", status: 403 },
        sourceUrl: AUTH,
      },
    ]);
  });

  it("sends one GET to the URL with a dummy client id", async () => {
    answer(400, "invalid_client");
    await probe();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(new URL(String(url)).searchParams.get("client_id")).toBe(
      "stamp-probe-not-a-real-client",
    );
    expect(init).toMatchObject({ method: "GET", redirect: "manual" });
  });

  it("emits only the stage events: no claim events from the probe", async () => {
    answer(400, "invalid_client");
    const { h } = await probe();
    expect(trace(h.events)).toEqual(["stage.started:6", "stage.done:6"]);
  });
});

describe("probeNode: a probe that changes nothing", () => {
  it.each([
    [404, "not_found"],
    [500, "server_error"],
    [200, "unexpected_status"],
  ])(
    "leaves every label alone on a %i and logs a failed row",
    async (status, reason) => {
      answer(status, "invalid_client");
      const { update } = await probe();
      expect(update.claims).toBeUndefined();
      expect(update.probeResult).toMatchObject({
        outcome: "failed",
        status,
        reason,
      });
      expect(
        (update.checks as { result: string }[]).slice(-2).map((c) => c.result),
      ).toEqual(["fail", "fail"]);
    },
  );

  it("leaves every label alone on a network error, and does not throw", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const { update } = await probe();
    expect(update.claims).toBeUndefined();
    expect(update.probeResult).toMatchObject({
      outcome: "failed",
      status: null,
      reason: "network_error",
    });
  });

  it("sends nothing and logs a failed row when the host resolves to a private address", async () => {
    dns.mockResolvedValue([{ address: "10.0.0.8", family: 4 }] as never);
    const { update } = await probe();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(update.probeResult).toMatchObject({
      outcome: "skipped",
      reason: "non_public_address",
    });
    expect(update.claims).toBeUndefined();
  });
});
