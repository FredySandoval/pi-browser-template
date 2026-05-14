import os from "node:os";
import path from "node:path";

export const DEFAULT_ALERT_TIMEOUT_MS = 25_000;
export const NATIVE_BRIDGE_DIR_NAME = "pi-native-bridge";
export const NATIVE_BRIDGE_SOCKET_NAME = "native-host.sock";
export const NATIVE_BRIDGE_WINDOWS_PIPE = "\\\\.\\pipe\\pi-native-bridge-host";
export const NATIVE_BRIDGE_TOKEN_FILE_NAME = "token";

export type NativeBridgeEnv = Partial<Record<
  "XDG_RUNTIME_DIR" | "PI_NATIVE_HOST_SOCKET" | "PI_NATIVE_HOST_TOKEN_FILE" | "PI_NATIVE_HOST_ALERT_TIMEOUT_MS",
  string | undefined
>>;

export function getNativeBridgeRuntimeDir(env: NativeBridgeEnv = process.env): string {
  return env.XDG_RUNTIME_DIR ?? os.tmpdir();
}

export function getNativeBridgeSocketPath(
  env: NativeBridgeEnv = process.env,
  platform = process.platform,
): string {
  return env.PI_NATIVE_HOST_SOCKET ?? (platform === "win32"
    ? NATIVE_BRIDGE_WINDOWS_PIPE
    : path.join(getNativeBridgeRuntimeDir(env), NATIVE_BRIDGE_DIR_NAME, NATIVE_BRIDGE_SOCKET_NAME));
}

export function getNativeBridgeTokenPath(env: NativeBridgeEnv = process.env): string {
  return env.PI_NATIVE_HOST_TOKEN_FILE ?? path.join(
    getNativeBridgeRuntimeDir(env),
    NATIVE_BRIDGE_DIR_NAME,
    NATIVE_BRIDGE_TOKEN_FILE_NAME,
  );
}

export function getNativeBridgeAlertTimeoutMs(
  env: NativeBridgeEnv = process.env,
  fallbackMs = DEFAULT_ALERT_TIMEOUT_MS,
): number {
  const value = Number(env.PI_NATIVE_HOST_ALERT_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}
