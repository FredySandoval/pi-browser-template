import { Type as t } from "typebox";
import { type Static } from "typebox";
import { Check } from "typebox/value";
import { NativeMessageType } from "./message-types.js";

export const NativeHostShowAlertMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.ShowAlert),
  message: t.Optional(t.String()),
  requestId: t.Optional(t.Number()),
});

export const NativeHostToBrowserMessageSchema = NativeHostShowAlertMessageSchema;

export type NativeHostShowAlertMessage = Static<typeof NativeHostShowAlertMessageSchema>;
export type NativeHostToBrowserMessage = Static<typeof NativeHostToBrowserMessageSchema>;

export function isNativeHostShowAlertMessage(value: unknown): value is NativeHostShowAlertMessage {
  return Check(NativeHostShowAlertMessageSchema, value);
}

export function isNativeHostToBrowserMessage(value: unknown): value is NativeHostToBrowserMessage {
  return Check(NativeHostToBrowserMessageSchema, value);
}
