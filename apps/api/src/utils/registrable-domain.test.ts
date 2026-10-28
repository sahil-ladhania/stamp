/**
 * File: registrable-domain.test.ts
 * Purpose: Tests reading hosts, registrable domains and brand labels out of typed input.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  domainLabel,
  hostFromTyped,
  registrableDomain,
} from "./registrable-domain.js";

describe("hostFromTyped", () => {
  it.each([
    [
      "https://developers.notion.com/docs/authorization",
      "developers.notion.com",
    ],
    ["http://www.hubspot.com", "hubspot.com"],
    ["hubspot.com", "hubspot.com"],
    ["  Docs.Slack.COM/apis  ", "docs.slack.com"],
    ["api.example.co.uk:8443/x?y=1", "api.example.co.uk"],
  ])("reads the host of %s", (typed, host) => {
    expect(hostFromTyped(typed)).toBe(host);
  });

  it.each([
    "Notion",
    "Google Calendar",
    "hub spot",
    "",
    "   ",
    "a.b",
    "notion.",
  ])("returns null for the app name %j", (typed) => {
    expect(hostFromTyped(typed)).toBeNull();
  });
});

describe("registrableDomain", () => {
  it.each([
    ["developers.notion.com", "notion.com"],
    ["notion.com", "notion.com"],
    ["www.notion.com", "notion.com"],
    ["a.b.c.hubspot.com", "hubspot.com"],
    ["docs.bbc.co.uk", "bbc.co.uk"],
    ["bbc.co.uk", "bbc.co.uk"],
    ["DEVELOPERS.Notion.COM.", "notion.com"],
    ["localhost", "localhost"],
  ])("turns %s into %s", (host, domain) => {
    expect(registrableDomain(host)).toBe(domain);
  });
});

describe("domainLabel", () => {
  it.each([
    ["developers.hubspot.com", "hubspot"],
    ["slack.dev", "slack"],
    ["docs.bbc.co.uk", "bbc"],
    ["www.linear.app", "linear"],
    ["localhost", "localhost"],
  ])("takes the brand from %s", (host, label) => {
    expect(domainLabel(host)).toBe(label);
  });
});
