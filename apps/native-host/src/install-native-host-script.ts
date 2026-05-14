#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

type SetupResult = {
  configDirPath: string;
  shellScriptPath: string;
  manifestPath: string;
};

function chromeExtensionIdFromKey(publicKeyBase64: string): string {
  const der = Buffer.from(publicKeyBase64, "base64");
  const hash = crypto.createHash("sha256").update(der).digest();

  return [...hash.subarray(0, 16)]
    .map((byte) =>
      String.fromCharCode("a".charCodeAt(0) + (byte >> 4)) +
      String.fromCharCode("a".charCodeAt(0) + (byte & 0x0f)),
    )
    .join("");
}

function getChromeExtensionId(): string {
  const explicitId = process.env.CHROME_EXTENSION_ID?.trim();
  if (explicitId) return explicitId;

  const publicKey = process.env.WXT_CHROME_EXTENSION_KEY?.trim();
  if (publicKey) return chromeExtensionIdFromKey(publicKey);

  throw new Error(
    "CHROME_EXTENSION_ID or WXT_CHROME_EXTENSION_KEY is required to install the native host",
  );
}

function loadEnvFiles(): void {
  const baseEnvPath = resolve(".env");

  if (existsSync(baseEnvPath)) {
    loadEnvFile(baseEnvPath);
  }

  const mode = process.env.WXT_MODE || process.env.NODE_ENV;
  if (!mode) return;

  const modeEnvPath = resolve(`.env.${mode}`);
  if (existsSync(modeEnvPath)) {
    loadEnvFile(modeEnvPath);
  }
}

function listFromEnv(value: string | undefined, fallback: string[]): string[] {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items?.length ? items : fallback;
}

function chromeOriginFromId(value: string): string {
  if (value.startsWith("chrome-extension://")) {
    return value.endsWith("/") ? value : `${value}/`;
  }

  return `chrome-extension://${value}/`;
}

async function main(): Promise<void> {
  loadEnvFiles();

  const { Setup } = await import("web-ext-native-msg");

  const browsers = listFromEnv(process.env.NATIVE_HOST_BROWSER, ["chrome"]);
  const hostName = process.env.WXT_NATIVE_HOST_NAME || "pi_native_bridge";
  const chromeExtensionId = getChromeExtensionId();
  const firefoxExtensionId = process.env.FIREFOX_EXTENSION_ID;

  for (const browser of browsers) {
    console.info(`[native-host] Installing for ${browser}...`);

    const setupOptions = {
      browser,
      hostName,
      hostDescription: "Pi Native Bridge Host",
      mainScriptFile: "dist/host.js",
      chromeExtensionIds: [chromeOriginFromId(chromeExtensionId)],
      overwriteConfig: true,
      callback: (info: SetupResult) => {
        console.info(`[native-host] Config: ${info.configDirPath}`);
        console.info(`[native-host] Launcher: ${info.shellScriptPath}`);
        console.info(`[native-host] Manifest: ${info.manifestPath}`);
      },
    };

    await new Setup(
      firefoxExtensionId
        ? { ...setupOptions, webExtensionIds: [firefoxExtensionId] }
        : setupOptions,
    ).run();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[native-host] Install failed: ${message}`);
  process.exit(1);
});
