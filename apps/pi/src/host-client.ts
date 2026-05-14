import fs from "node:fs/promises";
import net from "node:net";
import {
  NativeMessageType,
  isAlertResult,
  isNativeHostToPiMessage as isHostMessage,
  type AlertResult,
  type NativeHostToPiMessage as HostMessage,
  type PiToNativeHostMessage as PiToHostMessage,
} from "@repo/native-messaging-schemas";
import {
  getNativeBridgeAlertTimeoutMs,
  getNativeBridgeSocketPath,
  getNativeBridgeTokenPath,
} from "@repo/native-messaging-schemas/native-bridge-config";

let socket: net.Socket | undefined;
let buffer = "";
let nextRequestId = 1;

const pending = new Map<number, {
  resolve: (message: AlertResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

export async function connectToHost(options: { socketPath?: string; tokenFile?: string; token?: string } = {}): Promise<void> {
  if (socket && !socket.destroyed && socket.readyState === "open") return;

  socket?.destroy();
  socket = undefined;
  buffer = "";

  const token = options.token ?? process.env.PI_NATIVE_HOST_TOKEN ?? await readToken(options.tokenFile);
  const nextSocket = net.createConnection(options.socketPath ?? getNativeBridgeSocketPath());

  await new Promise<void>((resolve, reject) => {
    nextSocket.once("error", reject);
    nextSocket.once("connect", () => {
      nextSocket.off("error", reject);
      socket = nextSocket;
      attach(nextSocket);
      sendLine({ type: NativeMessageType.Auth, token });
      resolve();
    });
  });
}

export async function openBrowserAlertAndWait(message: string, timeoutMs = getNativeBridgeAlertTimeoutMs()): Promise<AlertResult> {
  await connectToHost();

  const requestId = nextRequestId++;
  const result = new Promise<AlertResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Timed out waiting for browser alert after ${timeoutMs}ms`));
    }, timeoutMs);
    pending.set(requestId, { resolve, reject, timeout });
  });

  sendLine({ type: NativeMessageType.ShowAlert, message, requestId });
  return result;
}

export function disconnectFromHost(): void {
  socket?.destroy();
  socket = undefined;
  buffer = "";
  rejectAll(new Error("Disconnected from native host"));
}

function attach(attached: net.Socket): void {
  attached.setEncoding("utf8");
  attached.on("data", (chunk: string) => {
    buffer += chunk;
    for (let i = buffer.indexOf("\n"); i !== -1; i = buffer.indexOf("\n")) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (line) handleLine(line);
    }
  });
  attached.on("close", () => {
    if (socket === attached) socket = undefined;
    buffer = "";
    rejectAll(new Error("Native host socket closed"));
  });
  attached.on("error", (error) => rejectAll(error));
}

function handleLine(line: string): void {
  try {
    const message = JSON.parse(line) as unknown;
    if (isHostMessage(message)) dispatch(message);
  } catch {}
}

function dispatch(message: HostMessage): void {
  if (message.type === NativeMessageType.SessionReplaced) {
    rejectAll(new Error(message.reason ?? "Native host session was replaced"));
    return;
  }
  if (!isAlertResult(message) || message.requestId === undefined) return;

  const item = pending.get(message.requestId);
  if (!item) return;

  pending.delete(message.requestId);
  clearTimeout(item.timeout);
  item.resolve(message);
}

function sendLine(message: PiToHostMessage): void {
  if (!socket || socket.destroyed) throw new Error("Native host socket is not connected");
  socket.write(`${JSON.stringify(message)}\n`);
}

function rejectAll(error: Error): void {
  for (const [id, item] of pending) {
    clearTimeout(item.timeout);
    item.reject(error);
    pending.delete(id);
  }
}

async function readToken(explicitPath?: string): Promise<string> {
  for (const file of [explicitPath, getNativeBridgeTokenPath()].filter(Boolean) as string[]) {
    try { return (await fs.readFile(file, "utf8")).trim(); }
    catch (error) { if (!isNotFound(error)) throw error; }
  }
  throw new Error("Native host token not found");
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
