import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { encodeNativeMessage, redactForLog } from "../apps/native-host/src/native-utils.cts";
import { getRuntimePaths } from "../packages/shared/src/runtime-paths.ts";

describe("encodeNativeMessage", () => {
  test("prefixes the JSON payload with a little-endian UTF-8 byte length", () => {
    const message = { type: "CANVAS_ERROR", reason: "é" } as never;
    const encoded = encodeNativeMessage(message);
    const json = JSON.stringify(message);
    const payload = Buffer.from(json, "utf8");

    expect(encoded.readUInt32LE(0)).toBe(payload.length);
    expect(encoded.subarray(4).toString()).toBe(json);
  });
});

describe("getRuntimePaths", () => {
  test("uses named pipe and LOCALAPPDATA on Windows", () => {
    const oldLocalAppData = process.env.LOCALAPPDATA;
    process.env.LOCALAPPDATA = "C:\\Users\\Test\\AppData\\Local";

    try {
      const paths = getRuntimePaths("pi-browser-template", "win32");

      expect(paths.ipcPath).toBe("\\\\.\\pipe\\pi-browser-template");
      expect(paths.tokenPath).toContain("C:\\Users\\Test\\AppData\\Local");
      expect(paths.tokenPath).toContain("pi-browser-template.token");
      expect(paths.logPath).toContain("pi-browser-template-host.log");
    } finally {
      if (oldLocalAppData === undefined) delete process.env.LOCALAPPDATA;
      else process.env.LOCALAPPDATA = oldLocalAppData;
    }
  });

  test("keeps existing Unix socket and token paths on non-Windows platforms", () => {
    const paths = getRuntimePaths("pi-browser-template", "linux");

    expect(paths.ipcPath).toBe("/tmp/pi-browser-template.sock");
    expect(paths.tokenPath).toBe("/tmp/pi-browser-template.token");
    expect(paths.logPath).toBe("/tmp/pi-browser-template-host.log");
  });
});

describe("redactForLog", () => {
  test("keeps ordinary message fields readable", () => {
    expect(redactForLog({ type: "CANVAS_ERROR", reason: "No tab" })).toBe(JSON.stringify({ type: "CANVAS_ERROR", reason: "No tab" }));
  });

  test("redacts large image payload fields", () => {
    const message = { type: "CANVAS_READY", url: "https://example.com", dataUrl: "secret" } as never;

    expect(redactForLog(message)).toBe(JSON.stringify({ type: "CANVAS_READY", url: "https://example.com", dataUrl: "[redacted]" }));
  });

  test("summarizes screenshot arrays", () => {
    const message = { type: "CANVAS_READY", url: "https://example.com", screenshots: ["a", "b"] } as never;

    expect(redactForLog(message)).toBe(JSON.stringify({ type: "CANVAS_READY", url: "https://example.com", screenshots: "[2 screenshots]" }));
  });
});

describe("native host installer", () => {
  test("installs to stable user data and leaves built extension files unchanged", () => {
    const project = mkdtempSync(join(tmpdir(), "pi-native-install-"));
    const home = join(project, "home");
    const xdgConfig = join(project, "config");
    const xdgData = join(project, "data");
    const installDir = join(project, "apps/native-host/install");
    const builtNativeDir = join(project, "dist/chrome-extension/native");
    const builtExtensionDir = join(project, "dist/chrome-extension");
    const sourceConfigDir = join(project, "apps/extension/src");

    mkdirSync(installDir, { recursive: true });
    mkdirSync(builtNativeDir, { recursive: true });
    mkdirSync(sourceConfigDir, { recursive: true });
    mkdirSync(home, { recursive: true });

    copyFileSync("apps/native-host/install/install.sh", join(installDir, "install.sh"));
    writeFileSync(join(project, "package.json"), JSON.stringify({ name: "pi-browser-template" }));
    writeFileSync(join(sourceConfigDir, "config.ts"), 'export const extensionConfig = { nativeHostName: "com.pi.pi_browser_template" } as const;\n');
    writeFileSync(join(builtNativeDir, "host.cjs"), "#!/usr/bin/env node\n");
    writeFileSync(join(builtNativeDir, "native-utils.cjs"), "module.exports = {};\n");
    writeFileSync(join(builtNativeDir, "runtime-paths.cjs"), "module.exports = {};\n");

    const configPath = join(builtExtensionDir, "config.js");
    const manifestPath = join(builtExtensionDir, "manifest.json");
    const configBefore = 'export const extensionConfig = { nativeHostName: "com.pi.pi_browser_template" };\n';
    const manifestBefore = JSON.stringify({ name: "Original", action: { default_title: "Original" } }, null, 2);
    writeFileSync(configPath, configBefore);
    writeFileSync(manifestPath, manifestBefore);
    chmodSync(join(installDir, "install.sh"), 0o755);

    const extensionId = "abcdefghijklmnopabcdefghijklmnop";
    const result = spawnSync("bash", [join(installDir, "install.sh"), extensionId], {
      encoding: "utf8",
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: xdgConfig, XDG_DATA_HOME: xdgData, CHROME_CONFIG_HOME: xdgConfig },
    });

    expect(result.status).toBe(0);
    expect(readFileSync(configPath, "utf8")).toBe(configBefore);
    expect(readFileSync(manifestPath, "utf8")).toBe(manifestBefore);

    const stableNativeDir = join(xdgData, "pi-browser-template/native");
    const wrapper = join(stableNativeDir, "host-wrapper.sh");
    const manifest = join(xdgConfig, "google-chrome/NativeMessagingHosts/com.pi.pi_browser_template.json");
    const manifestJson = JSON.parse(readFileSync(manifest, "utf8")) as { path: string; allowed_origins: string[] };
    const wrapperText = readFileSync(wrapper, "utf8");

    expect(existsSync(join(xdgData, "pi-browser-template/package.json"))).toBe(true);
    expect(existsSync(join(stableNativeDir, "host.cjs"))).toBe(true);
    expect(existsSync(join(stableNativeDir, "native-utils.cjs"))).toBe(true);
    expect(existsSync(join(stableNativeDir, "runtime-paths.cjs"))).toBe(true);
    expect(existsSync(wrapper)).toBe(true);
    expect(manifestJson.path).toBe(wrapper);
    expect(manifestJson.path).not.toContain("dist");
    expect(manifestJson.allowed_origins).toContain(`chrome-extension://${extensionId}/`);
    expect(wrapperText).not.toContain("/run/user/");
    expect(wrapperText).not.toContain("fnm_multishells");
  });
});
