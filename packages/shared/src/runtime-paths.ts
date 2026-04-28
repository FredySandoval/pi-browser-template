import os from "node:os";
import path from "node:path";

export type RuntimePaths = {
  ipcPath: string;
  tokenPath: string;
  logPath: string;
  appDataDir: string;
};

export function getRuntimePaths(packageName: string, platform: NodeJS.Platform = process.platform): RuntimePaths {
  const safeName = packageName.replace(/[^a-zA-Z0-9._-]/g, "-");

  if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const appDataDir = path.join(localAppData, safeName);

    return {
      ipcPath: `\\\\.\\pipe\\${safeName}`,
      tokenPath: path.join(appDataDir, `${safeName}.token`),
      logPath: path.join(appDataDir, `${safeName}-host.log`),
      appDataDir,
    };
  }

  return {
    ipcPath: `/tmp/${safeName}.sock`,
    tokenPath: `/tmp/${safeName}.token`,
    logPath: `/tmp/${safeName}-host.log`,
    appDataDir: process.env.XDG_DATA_HOME
      ? path.join(process.env.XDG_DATA_HOME, packageName)
      : path.join(os.homedir(), ".local", "share", packageName),
  };
}
