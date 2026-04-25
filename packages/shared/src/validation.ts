import { Check } from "typebox/value";
import { ProtocolMessageSchema } from "./messages.js";
import type { ProtocolMessage } from "./messages.js";

export function isProtocolMessage(value: unknown): value is ProtocolMessage {
  return Check(ProtocolMessageSchema, value);
}
