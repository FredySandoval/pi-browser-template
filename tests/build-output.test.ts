import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const extensionDir = "dist/chrome-extension";

function readBuiltFile(path: string): string {
  return readFileSync(`${extensionDir}/${path}`, "utf8");
}

describe("built Chrome extension", () => {
  test("includes every module imported by the background service worker", () => {
    expect(existsSync(`${extensionDir}/background.js`)).toBe(true);
    expect(existsSync(`${extensionDir}/browser-utils.js`)).toBe(true);
    expect(existsSync(`${extensionDir}/config.js`)).toBe(true);
  });

  test("uses a module service worker without unsupported config loading", () => {
    const manifest = JSON.parse(readBuiltFile("manifest.json")) as { background?: { type?: string } };
    const background = readBuiltFile("background.js");

    expect(manifest.background?.type).toBe("module");
    expect(background).not.toContain("await import");
    expect(background).not.toContain("importScripts");
  });
});

describe("built native host", () => {
  test("includes installer artifacts and local dependencies required by host.cjs", () => {
    expect(existsSync(`${extensionDir}/native/install.sh`)).toBe(true);
    expect(existsSync(`${extensionDir}/native/diagnose.sh`)).toBe(true);
    expect(existsSync(`${extensionDir}/native/host.cjs`)).toBe(true);
    expect(existsSync(`${extensionDir}/native/native-utils.cjs`)).toBe(true);
    expect(existsSync(`${extensionDir}/native/host-wrapper.sh`)).toBe(false);
  });

  test("starts without missing module errors", () => {
    const result = spawnSync("node", [`${extensionDir}/native/host.cjs`], {
      input: "",
      encoding: "utf8",
      timeout: 2000,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("MODULE_NOT_FOUND");
    expect(result.stderr).not.toContain("Cannot find module");
  });
});
