import { Type as t } from "typebox";
import { type Static } from "typebox";
import { Check } from "typebox/value";
import { NativeMessageType } from "./message-types.js";

export const AuthMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.Auth),
  token: t.String(),
});

export const PingMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.Ping),
  requestId: t.Optional(t.Number()),
});

export const ShowAlertRequestSchema = t.Object({
  type: t.Literal(NativeMessageType.ShowAlert),
  message: t.Optional(t.String()),
  requestId: t.Optional(t.Number()),
});

export const PiToNativeHostMessageSchema = t.Union([
  AuthMessageSchema,
  PingMessageSchema,
  ShowAlertRequestSchema,
]);

export type AuthMessage = Static<typeof AuthMessageSchema>;
export type PingMessage = Static<typeof PingMessageSchema>;
export type ShowAlertRequest = Static<typeof ShowAlertRequestSchema>;
export type PiToNativeHostMessage = Static<typeof PiToNativeHostMessageSchema>;

export function isAuthMessage(value: unknown): value is AuthMessage {
  return Check(AuthMessageSchema, value);
}

export function isPingMessage(value: unknown): value is PingMessage {
  return Check(PingMessageSchema, value);
}

export function isShowAlertRequest(value: unknown): value is ShowAlertRequest {
  return Check(ShowAlertRequestSchema, value);
}

export function isPiToNativeHostMessage(value: unknown): value is PiToNativeHostMessage {
  return Check(PiToNativeHostMessageSchema, value);
}
