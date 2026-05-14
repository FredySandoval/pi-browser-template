import { createEnv, getDefaultRuntimeEnv, type RuntimeEnv } from "@repo/env-wxt";
import Type from "typebox";
import { StandardSchemaV1 } from "@repo/env-wxt/standard.js";

const nativeHostNamePattern = "^(?!\\.)(?!.*\\.\\.)(?!.*\\.$)[a-z0-9_.]+$";

export const getWxtRuntimeEnv: () => RuntimeEnv = getDefaultRuntimeEnv;

export const keys = () =>
  createEnv({
    server: {},

    client: {
      WXT_CHROME_EXTENSION_KEY: StandardSchemaV1(Type.Union([
        Type.String({ minLength: 10 }),
        Type.Undefined()
      ])),
      WXT_NATIVE_HOST_NAME: StandardSchemaV1(
        Type.String({
          minLength: 10,
          pattern: nativeHostNamePattern,
        })
      ),
    },

    runtimeEnv: getWxtRuntimeEnv(),
    emptyStringAsUndefined: true,
  });
