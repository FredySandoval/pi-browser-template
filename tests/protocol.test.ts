import { describe, expect, test } from "bun:test";
import { isProtocolMessage } from "../packages/shared/src/protocol.js";

describe("isProtocolMessage", () => {
  test("accepts a minimal protocol message", () => {
    expect(isProtocolMessage({ type: "PING" })).toBe(true);
  });

  test("accepts an open canvas message with a request id", () => {
    expect(isProtocolMessage({ type: "OPEN_CANVAS", url: "https://example.com", requestId: 7 })).toBe(true);
  });

  test("rejects a known message with an invalid field type", () => {
    expect(isProtocolMessage({ type: "CANVAS_ERROR", reason: 404 })).toBe(false);
  });

  test("rejects an unknown message type", () => {
    expect(isProtocolMessage({ type: "NOPE" })).toBe(false);
  });
});
