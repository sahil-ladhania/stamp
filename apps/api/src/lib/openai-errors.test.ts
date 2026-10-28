/**
 * File: openai-errors.test.ts
 * Purpose: Tests callStructured timeout, abort and API error handling.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  callOptions as options,
  handleFor,
  hangingHandle as hangs,
} from "../test-support/fake-model.js";
import { TimeoutError } from "../utils/with-timeout.js";
import { ModelCallError, type ModelHandle } from "./openai-client.js";
import { callStructured } from "./openai.js";
import { createRunUsage } from "./usage.js";

type Invoke = ModelHandle["chat"]["invoke"];

afterEach(() => vi.restoreAllMocks());

describe("callStructured: timeout and abort", () => {
  it("throws a TimeoutError when the call takes longer than the deadline", async () => {
    const error = await callStructured(hangs, {
      ...options,
      timeoutMs: 30,
    }).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(TimeoutError);
    expect((error as Error).message).toContain("OpenAI plan");
  });

  it("rethrows the caller's abort reason when the run is aborted", async () => {
    const controller = new AbortController();
    const reason = new Error("run budget exhausted");
    const pending = callStructured(hangs, {
      ...options,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(reason), 10);
    await expect(pending).rejects.toBe(reason);
  });

  it("rejects at once for a signal that is already aborted, without calling the model", async () => {
    const invoke = vi.fn<Invoke>(async () => ({ content: "{}" }));
    const controller = new AbortController();
    controller.abort();
    await expect(
      callStructured(handleFor(invoke), {
        ...options,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("records no tokens for a call that timed out or aborted", async () => {
    const meter = createRunUsage();
    await callStructured(hangs, {
      ...options,
      timeoutMs: 20,
      usage: meter,
    }).catch(() => undefined);
    expect(meter.models.strong.calls).toBe(0);
  });
});

describe("callStructured: API errors", () => {
  it("wraps an API error without its upstream message, keeping the status and cause", async () => {
    const upstream = Object.assign(
      new Error("Incorrect API key provided: sk-abc...wxyz"),
      { status: 401 },
    );
    const failing = handleFor(
      vi.fn<Invoke>(async () => Promise.reject(upstream)),
    );
    const error = await callStructured(failing, options).catch(
      (err: unknown) => err,
    );
    expect(error).toBeInstanceOf(ModelCallError);
    expect(error).toMatchObject({
      status: 401,
      message: "OpenAI call to gpt-test-strong failed (status 401)",
    });
    expect((error as Error).message).not.toContain("sk-abc");
    expect((error as Error).cause).toBe(upstream);
  });

  it("wraps a network error that has no status", async () => {
    const failing = handleFor(
      vi.fn<Invoke>(async () => Promise.reject(new Error("ECONNRESET"))),
    );
    const error = await callStructured(failing, options).catch(
      (err: unknown) => err,
    );
    expect(error).toMatchObject({
      name: "ModelCallError",
      status: undefined,
      message: "OpenAI call to gpt-test-strong failed",
    });
  });
});
