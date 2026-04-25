import { describe, expect, test } from "bun:test";
import { isRestrictedUrl } from "../apps/extension/src/browser-utils.ts";

describe("isRestrictedUrl", () => {
  test("allows normal web pages", () => {
    expect(isRestrictedUrl("https://example.com")).toBe(false);
  });

  test("blocks missing URLs", () => {
    expect(isRestrictedUrl()).toBe(true);
  });

  test("blocks browser-owned pages", () => {
    expect(isRestrictedUrl("chrome://extensions")).toBe(true);
  });

  test("blocks source viewer pages", () => {
    expect(isRestrictedUrl("view-source:https://example.com")).toBe(true);
  });
});
