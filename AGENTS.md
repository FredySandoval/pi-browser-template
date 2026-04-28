# Project files:

```
apps/extension/public/config.js
apps/extension/public/icons/icon128.png
apps/extension/public/icons/icon16.png
apps/extension/public/icons/icon48.png
apps/extension/public/manifest.json
apps/extension/public/popup.html
apps/extension/src/background.ts
apps/extension/src/browser-utils.ts
apps/extension/src/config.ts
apps/extension/src/content.ts
apps/extension/src/popup.ts
apps/extension/tsconfig.json
apps/native-host/install/diagnose.sh
apps/native-host/install/install.sh
apps/native-host/install/uninstall.sh
apps/native-host/src/host.cts
apps/native-host/src/native-utils.cts
apps/native-host/tsconfig.json
apps/pi/src/host-message.ts
apps/pi/src/index.ts
apps/pi/src/names.ts
apps/pi/tsconfig.json
packages/shared/src/messages.ts
packages/shared/src/pi.ts
packages/shared/src/protocol.ts
packages/shared/src/validation.ts
packages/shared/tsconfig.json
scripts/copy-extension-assets.cjs
tests/build-output.test.ts
tests/extension.test.ts
tests/native-host.test.ts
tests/pi.test.ts
tests/protocol.test.ts
tests/tsconfig.json
AGENTS.md
CHANGELOG.md
LICENSE
README.md
tsconfig.base.json
tsconfig.json
types.d.ts
pnpm-lock.yaml
package.json
```

## Project Signatures

```ts
// scripts/copy-extension-assets.cjs
38 function copyFile(from, to);
43 function copyDir(from, to);
55 function stripEmptyModuleExport(file);
61 function chmodExecutable(file);

// apps/extension/src/background.ts
 19 function connectNative(): void;
 51 async function openCanvas(message: OpenCanvasMessage): Promise<void>;
 78 function waitForLoadThenSend(tabId: number, message: OpenCanvasMessage): void;
 89 async function sendToActiveTab(message: ProtocolMessage): Promise<void>;
 94 async function sendToTab(tabId: number, message: ProtocolMessage): Promise<void>;
103 function sendToNative(message: ProtocolMessage): void;
107 function sendCanvasError(message: OpenCanvasMessage, reason: string): void;
111 function pingNative(): Promise<ConnectionResult>;
123 function resolvePing(result: ConnectionResult): void;

// apps/extension/src/browser-utils.ts
1 export function isRestrictedUrl(url?: string): boolean;

// apps/extension/src/content.ts
12 function showCanvas(): void;

// apps/extension/src/popup.ts
 35 function mustGetElement<T extends HTMLElement = HTMLElement>(id: string): T;
 41 function copyToClipboard(text: string): void;
 45 function getPlatformText(): string;
 52 function isMacPlatform(): boolean;
 56 function isWindowsPlatform(): boolean;
 60 function getInstallCommand(id: string): string;
 67 async function checkConnection(): Promise<void>;
 83 function showConnected(): void;
 91 function showNotInstalled(detail: string): void;
 99 function showTrouble(error: string): void;
108 function showChecking(): void;

// apps/native-host/src/host.cts
 29 function readPackageJson(): { name: string };
 42 function reportFsError(action: string, err: unknown): void;
 49 function rotateLogIfNeeded(): void;
 58 function log(message: string): void;
 76 function ensureToken(): string | null;
 90 function writeMessage(message: NativeMessage): void;
 94 function processInput(): void;
115 function handleExtensionMessage(message: NativeMessage): void;
143 function cleanup(): never;

// apps/native-host/src/native-utils.cts
 5 export function encodeNativeMessage(message: NativeMessage): Buffer;
13 export function redactForLog(message: NativeMessage): string;

// apps/native-host/src/runtime-paths.cts
11 export function getRuntimePaths(packageName: string, platform: NodeJS.Platform = process.platform): RuntimePaths;

// apps/pi/src/host-message.ts
3 export function isHostMessage(value: unknown): value is HostMessage;

// apps/pi/src/index.ts
34 export default function activateBrowserTemplate(pi: ExtensionAPI): void;

// apps/pi/src/names.ts
1 export function safeName(name: string): string;
5 export function safeToolName(name: string): string;
9 export function toTitle(name: string): string;

// packages/shared/src/runtime-paths.ts
11 export function getRuntimePaths(packageName: string, platform: NodeJS.Platform = process.platform): RuntimePaths;

// packages/shared/src/validation.ts
5 export function isProtocolMessage(value: unknown): value is ProtocolMessage;
```

## How the pieces talk

```text
Pi command/tool
  -> apps/pi
  -> local socket + token
  -> apps/native-host
  -> Chrome native messaging
  -> apps/extension background
  -> active tab content script
  -> browser
```

The protocol lives in one place:

```text
packages/shared/src/messages.ts
```

Message types are created from TypeBox schemas, then reused across the Pi extension, native host, browser extension, and tests. If you add or change a message, start there.
