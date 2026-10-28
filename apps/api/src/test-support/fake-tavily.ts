/**
 * File: fake-tavily.ts
 * Purpose: A fake Tavily client and an axios-like error, so Tavily wrapper tests never touch the network.
 * Exports: fakeTavily, axiosLikeError, neverResolves
 * Used by: lib/tavily*.test.ts
 */
import { vi, type Mock } from "vitest";

export const fakeTavily: { search: Mock; extract: Mock; reset(): void } = {
  search: vi.fn(),
  extract: vi.fn(),
  /** Clears calls and restores the default (unconfigured) behaviour. */
  reset(): void {
    this.search.mockReset();
    this.extract.mockReset();
  },
};

/** What axios throws on an HTTP error: the config holds the Authorization header, which must never leak. */
export function axiosLikeError(status: number): Error {
  return Object.assign(
    new Error(
      "Request failed with status code " + status + " for tvly-secret-key",
    ),
    {
      response: { status },
      config: { headers: { Authorization: "Bearer tvly-secret-key" } },
    },
  );
}

/** A promise that never settles, standing in for a hung request. */
export const neverResolves = (): Promise<never> => new Promise(() => {});
