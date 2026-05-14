#!/usr/bin/env node

/** Native messaging host + tiny local JSON-lines socket bridge. */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import {
  NativeMessageType,
  isBrowserToNativeHostMessage,
  isPiToNativeHostMessage,
  type PiToNativeHostMessage,
} from "@repo/native-messaging-schemas";
import {
  getNativeBridgeAlertTimeoutMs,
  getNativeBridgeSocketPath,
  getNativeBridgeTokenPath,
} from "@repo/native-messaging-schemas/native-bridge-config";

type Pending = { socket: net.Socket; requestId: number | undefined; timeout: ReturnType<typeof setTimeout> };

const NATIVE_MESSAGE_LENGTH_HEADER_BYTES = 4;
const HOST_TOKEN_RANDOM_BYTES = 32;
const PRIVATE_DIRECTORY_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_SOCKET_MODE = 0o600;
const EXIT_CODE_SIGINT = 130;
const EXIT_CODE_SIGTERM = 143;

const socketPath = getNativeBridgeSocketPath();
const tokenPath = getNativeBridgeTokenPath();
const token = process.env.PI_NATIVE_HOST_TOKEN ?? getOrCreateToken();
const timeoutMs = getNativeBridgeAlertTimeoutMs();

let stdinBuffer = Buffer.alloc(0);
let nextId = 1;
const pending = new Map<number, Pending>();

function log(message: string): void {
  process.stderr.write(`[native-host] ${message}\n`);
}

function sendNative(message: unknown): void {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(NATIVE_MESSAGE_LENGTH_HEADER_BYTES);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(header);
  process.stdout.write(body);
}

function sendSocket(socket: net.Socket, message: unknown): void {
  if (!socket.destroyed) socket.write(`${JSON.stringify(message)}\n`);
}

function getOrCreateToken(): string {
  if (fs.existsSync(tokenPath)) return fs.readFileSync(tokenPath, "utf8").trim();
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  const value = crypto.randomBytes(HOST_TOKEN_RANDOM_BYTES).toString("hex");
  fs.writeFileSync(tokenPath, value, { mode: PRIVATE_FILE_MODE });
  return value;
}

function onSocketMessage(socket: net.Socket, authed: { value: boolean }, message: PiToNativeHostMessage): void {
  if (!authed.value) {
    if (message.type === NativeMessageType.Auth && message.token === token) {
      authed.value = true;
      sendSocket(socket, { type: NativeMessageType.Pong });
    } else {
      sendSocket(socket, { type: NativeMessageType.AlertError, reason: "Authentication failed" });
      socket.destroy();
    }
    return;
  }

  if (message.type === NativeMessageType.Ping) {
    sendSocket(socket, { type: NativeMessageType.Pong, requestId: message.requestId });
    return;
  }

  if (message.type !== NativeMessageType.ShowAlert) {
    sendSocket(socket, {
      type: NativeMessageType.AlertError,
      reason: `Unsupported message type: ${message.type}`,
      requestId: "requestId" in message ? message.requestId : undefined,
    });
    return;
  }

  const id = nextId++;
  const requestId = message.requestId;
  const timeout = setTimeout(() => {
    pending.delete(id);
    sendSocket(socket, { type: NativeMessageType.AlertTimeout, reason: "Timed out waiting for browser extension response", requestId });
  }, timeoutMs);

  pending.set(id, { socket, requestId, timeout });
  sendNative({ type: NativeMessageType.ShowAlert, message: message.message, requestId: id });
}

function onNativeMessage(message: unknown): void {
  if (!isBrowserToNativeHostMessage(message)) return;

  const id = message.requestId;
  if (id === undefined) return;

  const item = pending.get(id);
  if (!item) return;

  clearTimeout(item.timeout);
  pending.delete(id);
  sendSocket(item.socket, message.type === NativeMessageType.AlertShown
    ? { type: NativeMessageType.AlertShown, url: message.url ?? "", requestId: item.requestId }
    : { type: NativeMessageType.AlertError, reason: message.reason ?? "Unknown browser alert error", requestId: item.requestId });
}

process.stdin.on("data", (chunk: Buffer) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
  while (stdinBuffer.length >= NATIVE_MESSAGE_LENGTH_HEADER_BYTES) {
    const len = stdinBuffer.readUInt32LE(0);
    if (stdinBuffer.length < len + NATIVE_MESSAGE_LENGTH_HEADER_BYTES) return;
    const payload = stdinBuffer.subarray(NATIVE_MESSAGE_LENGTH_HEADER_BYTES, len + NATIVE_MESSAGE_LENGTH_HEADER_BYTES);
    stdinBuffer = stdinBuffer.subarray(len + NATIVE_MESSAGE_LENGTH_HEADER_BYTES);
    try { onNativeMessage(JSON.parse(payload.toString("utf8")) as unknown); }
    catch (error) { log(`Bad native message: ${error instanceof Error ? error.message : String(error)}`); }
  }
});

if (process.platform !== "win32") {
  fs.mkdirSync(path.dirname(socketPath), { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);
}

const server = net.createServer((socket) => {
  const authed = { value: false };
  let buffer = "";
  socket.setEncoding("utf8");
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    for (let i = buffer.indexOf("\n"); i !== -1; i = buffer.indexOf("\n")) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line) as unknown;
        isPiToNativeHostMessage(msg)
          ? onSocketMessage(socket, authed, msg)
          : sendSocket(socket, { type: NativeMessageType.AlertError, reason: "Invalid JSON message" });
      } catch {
        sendSocket(socket, { type: NativeMessageType.AlertError, reason: "Invalid JSON message" });
      }
    }
  });
  socket.on("close", () => {
    for (const [id, item] of pending) if (item.socket === socket) { clearTimeout(item.timeout); pending.delete(id); }
  });
});

server.on("error", (error) => log(`Socket server error: ${error.message}`));
server.listen(socketPath, () => {
  if (process.platform !== "win32") fs.chmodSync(socketPath, PRIVATE_SOCKET_MODE);
  log(`Listening at ${socketPath}; token file: ${tokenPath}`);
});

function shutdown(code: number): void {
  for (const item of pending.values()) clearTimeout(item.timeout);
  server.close(() => {
    if (process.platform !== "win32") fs.rmSync(socketPath, { force: true });
    process.exit(code);
  });
}

process.stdin.on("end", () => shutdown(0));
process.on("SIGINT", () => shutdown(EXIT_CODE_SIGINT));
process.on("SIGTERM", () => shutdown(EXIT_CODE_SIGTERM));
process.stdin.resume();
