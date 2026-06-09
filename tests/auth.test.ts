import { describe, expect, it } from "vitest";

import {
  isAllowedSignInEmail,
  isOrganizationEmail,
  normalizeEmail,
} from "@/lib/auth";

describe("authentication email policy", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  Bruno@OliveSocialImpact.com ")).toBe(
      "bruno@olivesocialimpact.com",
    );
  });

  it("allows organization emails to register and sign in", () => {
    expect(isOrganizationEmail("rosalyn@olivesocialimpact.com")).toBe(true);
    expect(isAllowedSignInEmail("bruno@olivesocialimpact.com")).toBe(true);
  });

  it("rejects lookalike and unrelated domains", () => {
    expect(isOrganizationEmail("user@olivesocialimpact.com.example.org")).toBe(
      false,
    );
    expect(isOrganizationEmail("user@gmail.com")).toBe(false);
  });

  it("preserves explicitly configured admin sign-in access", () => {
    expect(isAllowedSignInEmail("bacelardigitaltech@gmail.com")).toBe(true);
  });
});
