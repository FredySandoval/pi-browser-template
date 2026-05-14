import { Type as t } from "typebox";
import { type Static } from "typebox";
import { Check } from "typebox/value";
import { AlertErrorMessageSchema, AlertShownMessageSchema, NativeMessageType } from "./message-types.js";

export const PongMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.Pong),
  requestId: t.Optional(t.Number()),
});

export const AlertShownSchema = AlertShownMessageSchema;
export const AlertErrorSchema = AlertErrorMessageSchema;

export const AlertTimeoutSchema = t.Object({
  type: t.Literal(NativeMessageType.AlertTimeout),
  reason: t.Optional(t.String()),
  requestId: t.Optional(t.Number()),
});

export const SessionReplacedSchema = t.Object({
  type: t.Literal(NativeMessageType.SessionReplaced),
  reason: t.Optional(t.String()),
});

export const AlertResultSchema = t.Union([
  AlertShownSchema,
  AlertErrorSchema,
  AlertTimeoutSchema,
]);

export const NativeHostToPiMessageSchema = t.Union([
  PongMessageSchema,
  AlertResultSchema,
  SessionReplacedSchema,
]);

export type PongMessage = Static<typeof PongMessageSchema>;
export type AlertShown = Static<typeof AlertShownSchema>;
export type AlertError = Static<typeof AlertErrorSchema>;
export type AlertTimeout = Static<typeof AlertTimeoutSchema>;
export type SessionReplaced = Static<typeof SessionReplacedSchema>;
export type AlertResult = Static<typeof AlertResultSchema>;
export type NativeHostToPiMessage = Static<typeof NativeHostToPiMessageSchema>;

export function isPongMessage(value: unknown): value is PongMessage {
  return Check(PongMessageSchema, value);
}

export function isAlertShown(value: unknown): value is AlertShown {
  return Check(AlertShownSchema, value);
}

export function isAlertError(value: unknown): value is AlertError {
  return Check(AlertErrorSchema, value);
}

export function isAlertTimeout(value: unknown): value is AlertTimeout {
  return Check(AlertTimeoutSchema, value);
}

export function isSessionReplaced(value: unknown): value is SessionReplaced {
  return Check(SessionReplacedSchema, value);
}

export function isAlertResult(value: unknown): value is AlertResult {
  return Check(AlertResultSchema, value);
}

export function isNativeHostToPiMessage(value: unknown): value is NativeHostToPiMessage {
  return Check(NativeHostToPiMessageSchema, value);
}
