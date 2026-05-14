import { Type as t } from "typebox";
import { type Static } from "typebox";
import { Check } from "typebox/value";
import { AlertErrorMessageSchema, AlertShownMessageSchema } from "./message-types.js";

export const BrowserAlertShownMessageSchema = AlertShownMessageSchema;
export const BrowserAlertErrorMessageSchema = AlertErrorMessageSchema;

export const BrowserToNativeHostMessageSchema = t.Union([
  BrowserAlertShownMessageSchema,
  BrowserAlertErrorMessageSchema,
]);

export type BrowserAlertShownMessage = Static<typeof BrowserAlertShownMessageSchema>;
export type BrowserAlertErrorMessage = Static<typeof BrowserAlertErrorMessageSchema>;
export type BrowserToNativeHostMessage = Static<typeof BrowserToNativeHostMessageSchema>;

export function isBrowserAlertShownMessage(value: unknown): value is BrowserAlertShownMessage {
  return Check(BrowserAlertShownMessageSchema, value);
}

export function isBrowserAlertErrorMessage(value: unknown): value is BrowserAlertErrorMessage {
  return Check(BrowserAlertErrorMessageSchema, value);
}

export function isBrowserToNativeHostMessage(value: unknown): value is BrowserToNativeHostMessage {
  return Check(BrowserToNativeHostMessageSchema, value);
}
