import { describe, expect, it } from "vitest";

import {
  localToUtc,
  utcToTimezone,
} from "../../src/utils/timezone.js";

describe("DST handling", () => {
  it("rejects a nonexistent spring-forward time", () => {
    expect(() =>
      localToUtc(
        "2027-03-14T02:30:00",
        "America/New_York",
      ),
    ).toThrow(
      "does not exist",
    );
  });

  it("rejects an ambiguous fall-back time", () => {
    expect(() =>
      localToUtc(
        "2026-11-01T01:30:00",
        "America/New_York",
      ),
    ).toThrow(
      "ambiguous",
    );
  });

  it("handles New York winter offset", () => {
    const result = localToUtc(
      "2027-01-15T10:00:00",
      "America/New_York",
    );

    expect(result.toISO()).toBe(
      "2027-01-15T15:00:00.000Z",
    );
  });

  it("handles New York summer offset", () => {
    const result = localToUtc(
      "2027-07-15T10:00:00",
      "America/New_York",
    );

    expect(result.toISO()).toBe(
      "2027-07-15T14:00:00.000Z",
    );
  });

  it("handles London summer time", () => {
    const result = localToUtc(
      "2027-07-15T15:00:00",
      "Europe/London",
    );

    expect(result.toISO()).toBe(
      "2027-07-15T14:00:00.000Z",
    );
  });

  it("handles India without DST", () => {
    const result = localToUtc(
      "2027-07-15T19:30:00",
      "Asia/Kolkata",
    );

    expect(result.toISO()).toBe(
      "2027-07-15T14:00:00.000Z",
    );
  });
});