import { Type } from "typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type {
  CanvasErrorMessage,
  CanvasReadyMessage,
  CanvasTimeoutMessage,
  HostMessage,
  ProtocolMessage,
  SessionReplacedMessage,
} from "../../../packages/shared/src/protocol.js";
import type { PiContext } from "../../../packages/shared/src/pi.js";
import { isHostMessage } from "./host-message.js";
import { safeName, safeToolName, toTitle } from "./names.js";
import * as net from "node:net";
import * as fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
const packageName = packageJson.name;
const packageTitle = toTitle(packageName);
const socketName = safeName(packageName);
const SOCKET_PATH = `/tmp/${socketName}.sock`;
const TOKEN_PATH = `/tmp/${socketName}.token`;
const MAX_SOCKET_BUFFER = 8 * 1024 * 1024;
const CANVAS_READY_TIMEOUT_MS = 5000;

type CanvasResult = CanvasReadyMessage | CanvasErrorMessage | CanvasTimeoutMessage | SessionReplacedMessage;

type PendingCanvas = {
  resolve: (message: CanvasResult) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

export default function activateBrowserTemplate(pi: ExtensionAPI): void {
  let socket: net.Socket | null = null;
  let buffer = "";
  let currentCtx: PiContext | null = null;
  let nextRequestId = 1;
  const pendingCanvases = new Map<number, PendingCanvas>();

  function setStatus(message: string): void {
    currentCtx?.ui?.setStatus?.(packageName, message);
  }

  function setReadyStatus(_message: string): void {
    setStatus(statusText("success", `● ${packageName}`));
  }

  function setErrorStatus(message: string): void {
    setStatus(statusText("error", `● ${packageName}: ${message}`));
  }

  function statusText(color: "success" | "error", text: string): string {
    return currentCtx?.ui?.theme?.fg?.(color, text) || text;
  }

  async function start(args: string, ctx: PiContext): Promise<void> {
    currentCtx = ctx;
    const url = args.trim() || undefined;

    try {
      await connectToHost();
      sendToHost({ type: "OPEN_CANVAS", ...(url ? { url } : {}), requestId: createRequestId() });
      ctx.ui?.notify?.("Browser canvas opened", "info");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorStatus(`Browser extension not connected: ${message}`);
      ctx.ui?.notify?.(`Browser extension not connected: ${message}`, "error");
    }
  }

  pi.registerCommand(packageName, {
    description: "Open the blank browser canvas. Optionally provide a URL.",
    handler: start,
  });

  pi.registerTool({
    name: safeToolName(packageName),
    label: packageTitle,
    description: "Open the blank browser canvas and verify the browser wiring is connected.",
    promptSnippet: `Use when the user asks to open the ${packageTitle} canvas.`,
    parameters: Type.Object({
      url: Type.Optional(Type.String({ description: "URL to open before showing the canvas." })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx): Promise<{ content: { type: "text"; text: string }[] }> {
      currentCtx = ctx;
      try {
        await connectToHost();
        const ready = await openCanvasAndWait((params as { url?: string }).url);
        if (ready.type === "CANVAS_TIMEOUT") {
          return { content: [{ type: "text", text: "Browser canvas open request sent, but no ready confirmation was received." }] };
        }

        if (ready.type === "CANVAS_ERROR") {
          return { content: [{ type: "text", text: `Browser canvas failed: ${ready.reason}` }] };
        }

        if (ready.type === "SESSION_REPLACED") {
          return { content: [{ type: "text", text: `Browser canvas session replaced: ${ready.reason}` }] };
        }

        const target = ready.url;
        return { content: [{ type: "text", text: `Browser canvas opened on ${target}.` }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorStatus(`Browser extension not connected: ${message}`);
        return { content: [{ type: "text", text: `Browser extension not connected: ${message}` }] };
      }
    },
  });

  function connectToHost(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket && !socket.destroyed) return resolve();

      let token = "";
      try {
        token = fs.readFileSync(TOKEN_PATH, "utf8").trim();
      } catch (err) {
        return reject(err);
      }

      socket = net.createConnection(SOCKET_PATH);
      socket.on("connect", () => {
        sendToHost({ type: "AUTH", token });
        setStatus("Connected to native host");
        resolve();
      });
      socket.on("data", onData);
      socket.on("error", reject);
      socket.on("close", () => {
        socket = null;
        buffer = "";
        failPendingCanvases("Disconnected from native host");
        setErrorStatus("Disconnected from native host");
      });
    });
  }

  function onData(data: Buffer): void {
    buffer += data.toString();
    if (buffer.length > MAX_SOCKET_BUFFER) {
      socket?.destroy();
      buffer = "";
      return;
    }

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      let payload: unknown;
      try {
        payload = JSON.parse(line);
      } catch {
        setErrorStatus("Received invalid message from native host");
        continue;
      }

      if (!isHostMessage(payload)) {
        setErrorStatus("Received unexpected message from native host");
        continue;
      }

      const message = payload;
      setStatus(`Received: ${message.type}`);

      if (message.type === "CANVAS_READY") {
        resolvePendingCanvas(message);
        setReadyStatus(`Browser canvas ready on ${message.url || "the current tab"}`);
        continue;
      }

      if (message.type === "CANVAS_ERROR") {
        resolvePendingCanvas(message);
        setErrorStatus(message.reason);
        continue;
      }

      if (message.type === "SESSION_REPLACED") {
        failPendingCanvases(message.reason, message);
        setErrorStatus(message.reason);
        currentCtx?.ui?.notify?.(`Browser canvas session replaced: ${message.reason}`, "error");
      }
    }
  }

  function openCanvasAndWait(url?: string): Promise<CanvasResult> {
    const requestId = createRequestId();
    sendToHost({ type: "OPEN_CANVAS", ...(url ? { url } : {}), requestId });

    return new Promise<CanvasResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        pendingCanvases.delete(requestId);
        resolve({ type: "CANVAS_TIMEOUT", ...(url ? { url } : {}), requestId });
      }, CANVAS_READY_TIMEOUT_MS);

      pendingCanvases.set(requestId, { resolve, timeoutId });
    });
  }

  function resolvePendingCanvas(message: Extract<HostMessage, { type: "CANVAS_READY" | "CANVAS_ERROR" }>): void {
    if (!message.requestId) return;
    const pending = pendingCanvases.get(message.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingCanvases.delete(message.requestId);
    pending.resolve(message);
  }

  function failPendingCanvases(reason: string, message?: SessionReplacedMessage): void {
    for (const [requestId, pending] of pendingCanvases) {
      clearTimeout(pending.timeoutId);
      pending.resolve(message || { type: "CANVAS_ERROR", reason, requestId });
    }
    pendingCanvases.clear();
  }

  function createRequestId(): number {
    return nextRequestId++;
  }

  function sendToHost(message: ProtocolMessage): void {
    socket?.write(JSON.stringify(message) + "\n");
  }
}

