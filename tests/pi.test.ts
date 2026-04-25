import { describe, expect, test } from "bun:test";
import { isHostMessage } from "../apps/pi/src/host-message.js";
import { safeName, safeToolName, toTitle } from "../apps/pi/src/names.js";

describe("isHostMessage", () => {
  test("accepts messages that the Pi runtime can receive from the host", () => {
    expect(isHostMessage({ type: "CANVAS_READY", url: "https://example.com" })).toBe(true);
  });

  test("rejects messages that only flow from Pi to the host", () => {
    expect(isHostMessage({ type: "OPEN_CANVAS" })).toBe(false);
  });

  test("rejects non-object input", () => {
    expect(isHostMessage(null)).toBe(false);
  });
});

describe("safeName", () => {
  test("keeps filesystem-safe package name characters", () => {
    expect(safeName("pi.browser-template_1")).toBe("pi.browser-template_1");
  });

  test("replaces unsafe socket name characters with dashes", () => {
    expect(safeName("@scope/pi browser/template")).toBe("-scope-pi-browser-template");
  });
});

describe("safeToolName", () => {
  test("keeps tool-safe letters numbers and underscores", () => {
    expect(safeToolName("pi_browser_1")).toBe("pi_browser_1");
  });

  test("replaces non-tool characters with underscores", () => {
    expect(safeToolName("pi-browser.template")).toBe("pi_browser_template");
  });
});

describe("toTitle", () => {
  test("turns a package name into a readable title", () => {
    expect(toTitle("pi-browser_template")).toBe("Pi Browser Template");
  });

  test("omits npm scope from the title", () => {
    expect(toTitle("@scope/pi-browser-template")).toBe("Pi Browser Template");
  });
});
