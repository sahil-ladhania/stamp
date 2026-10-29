/**
 * File: database-label.test.ts
 * Purpose: Tests that the database label shows host, port and database name and never the user or password.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { databaseLabel } from "./database-label.js";

describe("databaseLabel", () => {
  it("shows host, port and database name", () => {
    expect(databaseLabel("mysql://app:s3cret@db.example.com:3307/stamp")).toBe(
      "db.example.com:3307/stamp",
    );
  });

  it("assumes the MySQL port when the URL has none", () => {
    expect(databaseLabel("mysql://app:s3cret@localhost/stamp")).toBe(
      "localhost:3306/stamp",
    );
  });

  it.each([
    "mysql://app:s3cret@db.example.com:3307/stamp",
    "mysql://app:s3cret@localhost/stamp",
    "not a url, but s3cret is in it",
  ])("never shows the user or the password in the label for %s", (url) => {
    const label = databaseLabel(url);
    expect(label).not.toContain("s3cret");
    expect(label).not.toContain("app:");
  });

  it("does not throw on a URL it cannot read", () => {
    expect(databaseLabel("")).toBe("an unreadable DATABASE_URL");
  });
});
