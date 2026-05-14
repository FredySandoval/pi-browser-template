import { createEnv } from "@repo/env-wxt";
import { getWxtRuntimeEnv, keys as wtx_keys } from "@repo/wxt/keys";

export const env = createEnv({
  extends: [
    wtx_keys(),
  ],
  server: {},
  client: {},
  runtimeEnv: getWxtRuntimeEnv(),
  isServer: false,
});
