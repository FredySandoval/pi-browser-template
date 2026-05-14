import { defineConfig } from "wxt";
// import { env } from "./env";
import { keys } from "@repo/wxt/keys";

// See https://wxt.dev/api/config.html
export default defineConfig({
  outDir: "../../dist",
  webExt: {
    disabled: true,
  },
  // https://wxt.dev/guide/resources/upgrading#v0-18-5-rarr-v0-19-0
  vite: () => ({
    ssr: {
      noExternal: ["@webext-core/messaging"],
    },
  }),
  manifest: ({ browser, manifestVersion, mode, command }) => {
    const env = keys();
    const isDev = mode === 'development';
    if (isDev && !env.WXT_CHROME_EXTENSION_KEY) {
      throw new Error("WXT_CHROME_EXTENSION_KEY is required in development");
    }

    return {
      permissions: ["nativeMessaging", "scripting", "tabs"],
      host_permissions: ["<all_urls>"],
      ...(isDev ? { key: env.WXT_CHROME_EXTENSION_KEY } : {}),
    };
  },
});
