# Project files:

```ts
// packages/env-wxt/index.ts
38 export function getDefaultRuntimeEnv(): RuntimeEnv;
57 [unsafe text omitted]

// packages/env-wxt/standard.ts
37 function PathSegments(pointer: string): string[];
41 function ErrorToIssue(error: TLocalizedValidationError): StandardSchemaV1.Issue;
48 export class StandardSchemaProps<Value> implements StandardSchemaV1.Props<Value, Value>, StandardJSONSchemaV1.Props<Value, Value> {
     constructor(type: TSchema);
   }
71 export class StandardSchema<Type extends TSchema, out Value extends unknown = Static<Type>> implements StandardSchemaV1<Value>, StandardJSONSchemaV1<Value> {
     constructor(type: Type);
   }
81 export function StandardSchemaV1<const Type extends TSchema>(type: Type): StandardSchema<Type>;

// apps/native-host/src/host.ts
40 function log(message: string): void;
44 function sendNative(message: unknown): void;
52 function sendSocket(socket: net.Socket, message: unknown): void;
56 function getOrCreateToken(): string;
64 function onSocketMessage(socket: net.Socket, authed: { value: boolean }, message: PiToNativeHostMessage): void;
101 function onNativeMessage(message: unknown): void;
165 function shutdown(code: number): void;

// apps/native-host/src/install-native-host-script.ts
14 function chromeExtensionIdFromKey(publicKeyBase64: string): string;
26 function getChromeExtensionId(): string;
38 function loadEnvFiles(): void;
54 function listFromEnv(value: string | undefined, fallback: string[]): string[];
63 function chromeOriginFromId(value: string): string;
71 async function main(): Promise<void>;

// apps/pi/src/define-command.ts
11 export function defineCommand(command: CommandDefinition): CommandDefinition;
15 export function registerCommand(pi: ExtensionAPI, command: CommandDefinition): void;
19 [unsafe text omitted]

// apps/pi/src/host-client.ts
27 export async function connectToHost(options: { socketPath?: string; tokenFile?: string; token?: string } = {}): Promise<void>;
49 export async function openBrowserAlertAndWait(message: string, timeoutMs = getNativeBridgeAlertTimeoutMs()): Promise<AlertResult>;
65 export function disconnectFromHost(): void;
72 function attach(attached: net.Socket): void;
90 function handleLine(line: string): void;
97 function dispatch(message: HostMessage): void;
112 function sendLine(message: PiToHostMessage): void;
117 function rejectAll(error: Error): void;
125 async function readToken(explicitPath?: string): Promise<string>;
133 function isNotFound(error: unknown): boolean;

// apps/pi/src/index.ts
7 export default function browserAlert(pi: ExtensionAPI): void;

// packages/native-messaging-schemas/src/browser-to-native-host.ts
18 export function isBrowserAlertShownMessage(value: unknown): value is BrowserAlertShownMessage;
22 export function isBrowserAlertErrorMessage(value: unknown): value is BrowserAlertErrorMessage;
26 export function isBrowserToNativeHostMessage(value: unknown): value is BrowserToNativeHostMessage;

// packages/native-messaging-schemas/src/message-types.ts
33 export function isAlertShownMessage(value: unknown): value is AlertShownMessage;
37 export function isAlertErrorMessage(value: unknown): value is AlertErrorMessage;

// packages/native-messaging-schemas/src/native-bridge-config.ts
15 export function getNativeBridgeRuntimeDir(env: NativeBridgeEnv = process.env): string;
19 export function getNativeBridgeSocketPath(env: NativeBridgeEnv = process.env, platform = process.platform): string;
28 export function getNativeBridgeTokenPath(env: NativeBridgeEnv = process.env): string;
36 export function getNativeBridgeAlertTimeoutMs(env: NativeBridgeEnv = process.env, fallbackMs = DEFAULT_ALERT_TIMEOUT_MS): number;

// packages/native-messaging-schemas/src/native-host-to-browser.ts
17 export function isNativeHostShowAlertMessage(value: unknown): value is NativeHostShowAlertMessage;
21 export function isNativeHostToBrowserMessage(value: unknown): value is NativeHostToBrowserMessage;

// packages/native-messaging-schemas/src/native-host-to-pi.ts
45 export function isPongMessage(value: unknown): value is PongMessage;
49 export function isAlertShown(value: unknown): value is AlertShown;
53 export function isAlertError(value: unknown): value is AlertError;
57 export function isAlertTimeout(value: unknown): value is AlertTimeout;
61 export function isSessionReplaced(value: unknown): value is SessionReplaced;
65 export function isAlertResult(value: unknown): value is AlertResult;
69 export function isNativeHostToPiMessage(value: unknown): value is NativeHostToPiMessage;

// packages/native-messaging-schemas/src/pi-to-native-host.ts
33 export function isAuthMessage(value: unknown): value is AuthMessage;
37 export function isPingMessage(value: unknown): value is PingMessage;
41 export function isShowAlertRequest(value: unknown): value is ShowAlertRequest;
45 export function isPiToNativeHostMessage(value: unknown): value is PiToNativeHostMessage;

// apps/browser-extension/entrypoints/background/index.ts
17 function connectNative(): void;
50 function sendToNative(message: unknown): NativeSendResult;
73 async function activeTab(): Promise<Browser.tabs.Tab | undefined>;
78 async function handleNativeMessage(port: Browser.runtime.Port, message: unknown): Promise<void>;

// apps/browser-extension/entrypoints/popup/main.ts
3 function setNativeStatus(result: NativeConnectionResult): void;
16 async function refreshNativeStatus(): Promise<void>;
```
