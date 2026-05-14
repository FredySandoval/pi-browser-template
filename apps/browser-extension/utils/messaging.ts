import { defineExtensionMessaging } from "@webext-core/messaging";

export type NativeConnectionResult = {
  connected: boolean;
  error?: string;
};

export type NativeSendResult = {
  ok: boolean;
  error?: string;
};

interface ProtocolMap {
  "native:ping"(): NativeConnectionResult;
  "native:send"(data: unknown): NativeSendResult;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
