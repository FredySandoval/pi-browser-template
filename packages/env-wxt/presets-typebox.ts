import Type from "typebox";
import { StandardSchemaV1 } from "./standard.js";
import { createEnv } from "./index.js";
import type { WxtEnv, ViteEnv } from "./presets.js";
type RuntimeEnv = Record<string, string | boolean | number | undefined>;

const getImportMetaEnv = (): RuntimeEnv =>
  (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};

/**
 * WXT Environment Variables
 * @see https://wxt.dev/guide/essentials/config/environment-variables.html#built-in-environment-variables
 */
export const wxt = (): Readonly<WxtEnv> =>
  createEnv({
    server: {},
    shared: {
      MANIFEST_VERSION: StandardSchemaV1(
        Type.Union([
          Type.Literal(2),
          Type.Literal(3),
          Type.Undefined(),
        ]),
      ),
      BROWSER: StandardSchemaV1(
        Type.Union([
          Type.Literal("chrome"),
          Type.Literal("firefox"),
          Type.Literal("safari"),
          Type.Literal("edge"),
          Type.Literal("opera"),
          Type.Undefined(),
        ]),
      ),
      CHROME: StandardSchemaV1(Type.Union([Type.Boolean(), Type.Undefined()])),
      FIREFOX: StandardSchemaV1(Type.Union([Type.Boolean(), Type.Undefined()])),
      SAFARI: StandardSchemaV1(Type.Union([Type.Boolean(), Type.Undefined()])),
      EDGE: StandardSchemaV1(Type.Union([Type.Boolean(), Type.Undefined()])),
      OPERA: StandardSchemaV1(Type.Union([Type.Boolean(), Type.Undefined()])),
    },
    runtimeEnv: getImportMetaEnv(),
    emptyStringAsUndefined: true,
  });

/**
 * Vite Environment Variables
 * @see https://vite.dev/guide/env-and-mode
 */
export const vite = (): Readonly<ViteEnv> =>
  createEnv({
    server: {},
    shared: {
      BASE_URL: StandardSchemaV1(Type.String()),
      MODE: StandardSchemaV1(Type.String()),
      DEV: StandardSchemaV1(Type.Boolean()),
      PROD: StandardSchemaV1(Type.Boolean()),
      SSR: StandardSchemaV1(Type.Boolean()),
    },
    runtimeEnv: getImportMetaEnv(),
    emptyStringAsUndefined: true,
  });
