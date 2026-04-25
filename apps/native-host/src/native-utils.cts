import type { ProtocolMessage } from "../../../packages/shared/src/protocol";

type NativeMessage = ProtocolMessage;

export function encodeNativeMessage(message: NativeMessage): Buffer {
  const json = JSON.stringify(message);
  const length = Buffer.alloc(4);
  length.writeUInt32LE(json.length);
  return Buffer.concat([length, Buffer.from(json)]);
}

export function redactForLog(message: NativeMessage): string {
  return JSON.stringify(message, (key, value: unknown) => {
    if (["screenshot", "beforeScreenshot", "afterScreenshot", "dataUrl"].includes(key)) return "[redacted]";
    if (key === "screenshots") return Array.isArray(value) ? `[${value.length} screenshots]` : "[redacted]";
    return value;
  });
}
