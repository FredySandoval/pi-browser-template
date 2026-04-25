import type { HostMessage } from "../../../packages/shared/src/protocol.js";

export function isHostMessage(value: unknown): value is HostMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  return type === "PONG"
    || type === "CANVAS_READY"
    || type === "CANVAS_ERROR"
    || type === "CANVAS_TIMEOUT"
    || type === "SESSION_REPLACED";
}
