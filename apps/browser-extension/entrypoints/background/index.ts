import { NativeMessageType, isNativeHostToBrowserMessage } from "@repo/native-messaging-schemas";
import { browser, type Browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { onMessage, type NativeConnectionResult, type NativeSendResult } from "../../utils/messaging";
import { env } from "../../env";

const nativeHostName = env.WXT_NATIVE_HOST_NAME;

const RECONNECT_BASE_MS = 2000; // 2s
const RECONNECT_MAX_MS = 60_000; // 60s

let nativePort: Browser.runtime.Port | null = null;
let lastNativeError = "";
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connectNative(): void {
  if (nativePort) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log("[extension] Connecting to native host:", nativeHostName);
  const port = browser.runtime.connectNative(nativeHostName);
  nativePort = port;

  port.onMessage.addListener((msg) => {
    reconnectAttempts = 0;
    console.log("[extension] From native host:", msg);
    void handleNativeMessage(port, msg);
  });

  port.onDisconnect.addListener(() => {
    lastNativeError =
      browser.runtime.lastError?.message ?? "Native host disconnected";
    console.warn("[extension] Native host disconnected:", lastNativeError);
    nativePort = null;
    // 2s, 4s, 8s, 16s, 32s, 60s, 60s, ...
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** reconnectAttempts,
      RECONNECT_MAX_MS
    );
    reconnectAttempts++;
    console.log(`[extension] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
    reconnectTimer = setTimeout(connectNative, delay);
  });
}

function sendToNative(message: unknown): NativeSendResult {
  if (!nativePort) {
    return {
      ok: false,
      error: lastNativeError || "Native host not connected",
    };
  }

  try {
    nativePort.postMessage(message);
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn("[extension] Failed to send to native host:", error);
    lastNativeError = error;
    nativePort = null;

    return { ok: false, error };
  }
}

const getConnectionError = (): string => lastNativeError.trim() || "Native host not connected";

async function activeTab(): Promise<Browser.tabs.Tab | undefined> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id === undefined ? (await browser.tabs.query({ active: true }))[0] : tab;
}

async function handleNativeMessage(port: Browser.runtime.Port, message: unknown): Promise<void> {
  if (!isNativeHostToBrowserMessage(message)) return;

  try {
    const tab = await activeTab();
    if (tab?.id === undefined) throw new Error("No active tab. Focus a browser window and try again.");

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text: string) => alert(text),
      args: [message.message ?? "Pi is connected to the browser."],
    });

    port.postMessage({ type: NativeMessageType.AlertShown, url: tab.url ?? "", requestId: message.requestId });
  } catch (error) {
    port.postMessage({ type: NativeMessageType.AlertError, reason: error instanceof Error ? error.message : String(error), requestId: message.requestId });
  }
}

export default defineBackground((): void => {
  connectNative();

  onMessage("native:ping", async (): Promise<NativeConnectionResult> => {
    if (nativePort) return { connected: true };

    return {
      connected: false,
      error: getConnectionError(),
    };
  });

  onMessage("native:send", async ({ data }): Promise<NativeSendResult> => sendToNative(data));

  console.log("[extension] Background loaded");
});
