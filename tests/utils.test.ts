import { describe, expect, it } from "vitest";

import { chunkItems } from "@/lib/arrays";
import { matchesCycle } from "@/lib/time-filters";
import type { TimeLog } from "@/lib/types";
import { isValidDateInput } from "@/lib/utils";

describe("date validation", () => {
  it("accepts real ISO calendar dates", () => {
    expect(isValidDateInput("2026-06-09")).toBe(true);
    expect(isValidDateInput("2024-02-29")).toBe(true);
  });

  it("rejects malformed and impossible dates", () => {
    expect(isValidDateInput("2026-02-29")).toBe(false);
    expect(isValidDateInput("2026-13-01")).toBe(false);
    expect(isValidDateInput("")).toBe(false);
  });
});

describe("Firestore batch chunking", () => {
  it("keeps every chunk below the configured write limit", () => {
    const chunks = chunkItems(
      Array.from({ length: 1001 }, (_, index) => index),
      450,
    );

    expect(chunks.map((chunk) => chunk.length)).toEqual([450, 450, 101]);
    expect(chunks.flat()).toHaveLength(1001);
  });
});

describe("history cycle filters", () => {
  const log = {
    id: "log",
    userId: "user",
    userName: "User",
    project: "Project",
    description: "Work",
    date: "2026-06-10",
    totalMinutes: 60,
    rate: 20,
    status: "pending",
    periodId: "",
  } satisfies TimeLog;

  it("does not include future entries in weekly filters", () => {
    expect(matchesCycle(log, "weekly", new Date("2026-06-09T12:00:00"))).toBe(
      false,
    );
  });

  it("includes entries from today", () => {
    expect(
      matchesCycle(
        { ...log, date: "2026-06-09" },
        "weekly",
        new Date("2026-06-09T12:00:00"),
      ),
    ).toBe(true);
  });
});
