import { Type as t } from "typebox";
import { type Static } from "typebox";
import { Check } from "typebox/value";

export const NativeMessageType = {
  Auth: "AUTH",
  Ping: "PING",
  Pong: "PONG",
  ShowAlert: "SHOW_ALERT",
  AlertShown: "ALERT_SHOWN",
  AlertError: "ALERT_ERROR",
  AlertTimeout: "ALERT_TIMEOUT",
  SessionReplaced: "SESSION_REPLACED",
} as const;

export type NativeMessageType = typeof NativeMessageType[keyof typeof NativeMessageType];

export const AlertShownMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.AlertShown),
  url: t.Optional(t.String()),
  requestId: t.Optional(t.Number()),
});

export const AlertErrorMessageSchema = t.Object({
  type: t.Literal(NativeMessageType.AlertError),
  reason: t.Optional(t.String()),
  requestId: t.Optional(t.Number()),
});

export type AlertShownMessage = Static<typeof AlertShownMessageSchema>;
export type AlertErrorMessage = Static<typeof AlertErrorMessageSchema>;

export function isAlertShownMessage(value: unknown): value is AlertShownMessage {
  return Check(AlertShownMessageSchema, value);
}

export function isAlertErrorMessage(value: unknown): value is AlertErrorMessage {
  return Check(AlertErrorMessageSchema, value);
}
