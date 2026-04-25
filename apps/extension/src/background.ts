import type { ConnectionResult, OpenCanvasMessage, ProtocolMessage } from "../../../packages/shared/src/protocol.js";
import { isRestrictedUrl } from "./browser-utils.js";
import { extensionConfig } from "./config.js";

type PendingPing = {
  promise: Promise<ConnectionResult>;
  resolve: (result: ConnectionResult) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

const extensionName = chrome.runtime.getManifest().name;
const logPrefix = `[${extensionName}]`;
const nativeHostName = extensionConfig.nativeHostName;

let nativePort: chrome.runtime.Port | null = null;
let pendingPing: PendingPing | null = null;
let lastNativeError = "";

function connectNative(): void {
  if (nativePort) return;

  console.log(logPrefix, "Connecting to native host...");
  const port = chrome.runtime.connectNative(nativeHostName);
  nativePort = port;

  port.onMessage.addListener((message: ProtocolMessage) => {
    if (message?.type === "PONG") {
      lastNativeError = "";
      resolvePing({ connected: true });
      return;
    }

    if (message?.type === "OPEN_CANVAS") {
      openCanvas(message).catch((err) => sendCanvasError(message, err instanceof Error ? err.message : String(err)));
      return;
    }

    sendToActiveTab(message);
  });

  port.onDisconnect.addListener(() => {
    const error = chrome.runtime.lastError?.message || "Native host disconnected";
    console.log(logPrefix, "Native host disconnected:", error);
    lastNativeError = error;
    resolvePing({ connected: false, error });
    if (nativePort === port) nativePort = null;
    setTimeout(connectNative, 2000);
  });
}

async function openCanvas(message: OpenCanvasMessage): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (message.url) {
    const target = tab?.id && !isRestrictedUrl(tab.url)
      ? await chrome.tabs.update(tab.id, { url: message.url })
      : await chrome.tabs.create({ url: message.url });
    if (!target?.id) {
      sendCanvasError(message, "Could not open target tab.");
      return;
    }
    waitForLoadThenSend(target.id, message);
    return;
  }

  if (!tab?.id || isRestrictedUrl(tab.url)) {
    sendCanvasError(message, "Open a normal web page or pass a URL.");
    return;
  }

  try {
    await sendToTab(tab.id, message);
  } catch (err) {
    sendCanvasError(message, err instanceof Error ? err.message : String(err));
  }
}

function waitForLoadThenSend(tabId: number, message: OpenCanvasMessage): void {
  const listener = (updatedTabId: number, info: chrome.tabs.TabChangeInfo) => {
    if (updatedTabId !== tabId || info.status !== "complete") return;
    chrome.tabs.onUpdated.removeListener(listener);
    setTimeout(() => {
      sendToTab(tabId, message).catch((err) => sendCanvasError(message, err instanceof Error ? err.message : String(err)));
    }, 150);
  };
  chrome.tabs.onUpdated.addListener(listener);
}

async function sendToActiveTab(message: ProtocolMessage): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && !isRestrictedUrl(tab.url)) await sendToTab(tab.id, message);
}

async function sendToTab(tabId: number, message: ProtocolMessage): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tabId, message);
  }
}

function sendToNative(message: ProtocolMessage): void {
  nativePort?.postMessage(message);
}

function sendCanvasError(message: OpenCanvasMessage, reason: string): void {
  sendToNative({ type: "CANVAS_ERROR", reason, ...(message.requestId ? { requestId: message.requestId } : {}) });
}

function pingNative(): Promise<ConnectionResult> {
  if (!nativePort) return Promise.resolve({ connected: false, error: lastNativeError || "Native host not connected" });
  if (pendingPing) return pendingPing.promise;

  let resolve: (result: ConnectionResult) => void = () => undefined;
  const promise = new Promise<ConnectionResult>((done) => { resolve = done; });
  const timeoutId = setTimeout(() => resolvePing({ connected: false, error: "Native host did not respond" }), 3000);
  pendingPing = { promise, resolve, timeoutId };
  nativePort.postMessage({ type: "PING" });
  return promise;
}

function resolvePing(result: ConnectionResult): void {
  if (!pendingPing) return;
  clearTimeout(pendingPing.timeoutId);
  pendingPing.resolve(result);
  pendingPing = null;
}

chrome.runtime.onMessage.addListener((
  message: ProtocolMessage,
  _sender,
  sendResponse: (response?: ConnectionResult) => void,
): true | undefined => {
  if (message?.type === "CHECK_CONNECTION") {
    pingNative().then(sendResponse);
    return true;
  }

  if (message?.type === "OPEN_CANVAS") {
    openCanvas(message).catch((err) => sendCanvasError(message, err instanceof Error ? err.message : String(err)));
    return undefined;
  }

  sendToNative(message);
  return undefined;
});

connectNative();
console.log(logPrefix, "Background loaded");
