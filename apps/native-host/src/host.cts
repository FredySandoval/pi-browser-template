#!/usr/bin/env node
import net = require("node:net");
import fs = require("node:fs");
import path = require("node:path");
import crypto = require("node:crypto");
import { encodeNativeMessage, redactForLog } from "./native-utils.cjs";
import type { ProtocolMessage } from "../../../packages/shared/src/protocol";

type NativeMessage = ProtocolMessage;

const packageJson = readPackageJson();
const packageName = packageJson.name.replace(/[^a-zA-Z0-9._-]/g, "-");
const SOCKET_PATH = `/tmp/${packageName}.sock`;
const TOKEN_PATH = `/tmp/${packageName}.token`;
const LOG_FILE = `/tmp/${packageName}-host.log`;
const MAX_NATIVE_MESSAGE_BYTES = 32 * 1024 * 1024;
const MAX_SOCKET_BUFFER = 32 * 1024 * 1024;
const MAX_LOG_BYTES = 5 * 1024 * 1024;

process.umask(0o077);

function readPackageJson(): { name: string } {
  const packagePaths = [
    path.join(__dirname, "..", "package.json"),
    path.join(__dirname, "..", "..", "package.json"),
  ];

  for (const packagePath of packagePaths) {
    if (fs.existsSync(packagePath)) return JSON.parse(fs.readFileSync(packagePath, "utf8")) as { name: string };
  }

  return { name: "pi-browser-template" };
}

function reportFsError(action: string, err: unknown): void {
  const code = err && typeof err === "object" && "code" in err && typeof err.code === "string" ? err.code : "";
  if (code === "ENOENT") return;
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${new Date().toISOString()} ${action}: ${message}`);
}

function rotateLogIfNeeded(): void {
  try {
    const stats = fs.statSync(LOG_FILE);
    if (stats.size > MAX_LOG_BYTES) fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
  } catch (err) {
    reportFsError(`Failed to rotate log ${LOG_FILE}`, err);
  }
}

function log(message: string): void {
  rotateLogIfNeeded();
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${message}\n`);
}

log("Host starting...");

try {
  fs.unlinkSync(SOCKET_PATH);
} catch (err) {
  reportFsError(`Failed to remove old socket ${SOCKET_PATH}`, err);
}

let piSocket: net.Socket | null = null;
let piAuthed = false;

function ensureToken(): string | null {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(TOKEN_PATH, token, { mode: 0o600 });
    return token;
  } catch (err) {
    log(`Failed to create token: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

const AUTH_TOKEN = ensureToken();
let inputBuffer = Buffer.alloc(0);

function writeMessage(message: NativeMessage): void {
  process.stdout.write(encodeNativeMessage(message));
}

function processInput(): void {
  while (inputBuffer.length >= 4) {
    const length = inputBuffer.readUInt32LE(0);
    if (length > MAX_NATIVE_MESSAGE_BYTES) {
      log(`Native message too large: ${length}`);
      inputBuffer = Buffer.alloc(0);
      return;
    }
    if (inputBuffer.length < 4 + length) break;

    const json = inputBuffer.slice(4, 4 + length).toString();
    inputBuffer = inputBuffer.slice(4 + length);

    try {
      handleExtensionMessage(JSON.parse(json) as NativeMessage);
    } catch (err) {
      log(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

function handleExtensionMessage(message: NativeMessage): void {
  log(`From extension: ${redactForLog(message)}`);

  if (message?.type === "PING") {
    writeMessage({ type: "PONG", timestamp: Date.now() });
    return;
  }

  if (piSocket && !piSocket.destroyed) {
    piSocket.write(JSON.stringify(message) + "\n");
  } else {
    log("No pi client connected, message dropped");
  }
}

process.stdin.on("readable", () => {
  let chunk: Buffer | string | null;
  while ((chunk = process.stdin.read()) !== null) {
    inputBuffer = Buffer.concat([inputBuffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    processInput();
  }
});

process.stdin.on("end", () => {
  log("Extension disconnected");
  cleanup();
});

function cleanup(): never {
  try {
    fs.unlinkSync(SOCKET_PATH);
  } catch (err) {
    reportFsError(`Failed to remove socket ${SOCKET_PATH}`, err);
  }

  try {
    fs.unlinkSync(TOKEN_PATH);
  } catch (err) {
    reportFsError(`Failed to remove token ${TOKEN_PATH}`, err);
  }

  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", (err) => {
  log(`Uncaught exception: ${err.message}`);
  cleanup();
});

const server = net.createServer((socket) => {
  log("Pi client connected");

  if (piSocket && !piSocket.destroyed) {
    if (piAuthed) {
      log("Replacing existing authenticated Pi client");
      try {
        piSocket.write(JSON.stringify({
          type: "SESSION_REPLACED",
          reason: "Another terminal connected to the browser template",
        }) + "\n");
      } catch (err) {
        log(`Error notifying old client: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      log("Replacing existing unauthenticated Pi client");
    }
    piSocket.destroy();
  }

  piSocket = socket;
  piAuthed = false;
  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();
    if (buffer.length > MAX_SOCKET_BUFFER) {
      log("Pi socket buffer overflow, closing connection");
      socket.destroy();
      buffer = "";
      return;
    }

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line) as NativeMessage;
        if (!piAuthed) {
          if (message?.type === "AUTH" && AUTH_TOKEN && message.token === AUTH_TOKEN) {
            piAuthed = true;
            log("Pi client authenticated");
          } else {
            log("Pi client authentication failed");
            socket.destroy();
            return;
          }
        } else {
          log(`From Pi: ${redactForLog(message)}`);
          writeMessage(message);
        }
      } catch (err) {
        log(`Pi parse error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  socket.on("close", () => {
    log("Pi client disconnected");
    if (piSocket === socket) {
      piSocket = null;
      piAuthed = false;
    }
  });

  socket.on("error", (err) => log(`Socket error: ${err.message}`));
});

server.listen(SOCKET_PATH, () => {
  log(`Listening on ${SOCKET_PATH}`);
  try {
    fs.chmodSync(SOCKET_PATH, 0o600);
  } catch (err) {
    reportFsError(`Failed to chmod socket ${SOCKET_PATH}`, err);
  }
});
