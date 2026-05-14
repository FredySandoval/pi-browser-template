import {
  createEnv as createCoreEnv,
  type CreateEnv,
  type CreateSchemaOptions,
  type DefaultCombinedSchema,
  type LooseOptions,
  type ServerClientOptions,
  type StandardSchemaDictionary,
  type StandardSchemaV1,
} from "@t3-oss/env-core";

const CLIENT_PREFIX = "WXT_";

type ClientPrefix = typeof CLIENT_PREFIX;
export type RuntimeEnv = Record<string, string | boolean | number | undefined>;

type Options<
  TServer extends StandardSchemaDictionary,
  TClient extends Record<`${ClientPrefix}${string}`, StandardSchemaV1>,
  TShared extends StandardSchemaDictionary,
  TExtends extends Array<Record<string, unknown>>,
  TFinalSchema extends StandardSchemaV1<{}, {}>,
> = Omit<
  LooseOptions<TShared, TExtends> &
  ServerClientOptions<ClientPrefix, TServer, TClient> &
  CreateSchemaOptions<TServer, TClient, TShared, TFinalSchema>,
  "clientPrefix" | "runtimeEnv"
> & {
  /**
   * Runtime environment variables to validate.
   *
   * Defaults to `import.meta.env` when running under WXT/Vite, then falls back
   * to `process.env` when available, then `{}`.
   */
  runtimeEnv?: RuntimeEnv;
};

export function getDefaultRuntimeEnv(): RuntimeEnv {
  const metaEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env;

  if (metaEnv) {
    return metaEnv;
  }

  if (typeof process !== "undefined") {
    return process.env;
  }

  return {};
}

/**
 * Create a WXT environment variable schema.
 *
 * Client variables must use the `WXT_` prefix.
 */
export function createEnv<
  TServer extends StandardSchemaDictionary = NonNullable<unknown>,
  TClient extends Record<`${ClientPrefix}${string}`, StandardSchemaV1> = NonNullable<unknown>,
  TShared extends StandardSchemaDictionary = NonNullable<unknown>,
  const TExtends extends Array<Record<string, unknown>> = [],
  TFinalSchema extends StandardSchemaV1<{}, {}> = DefaultCombinedSchema<
    TServer,
    TClient,
    TShared
  >,
>(
  opts: Options<TServer, TClient, TShared, TExtends, TFinalSchema>,
): CreateEnv<TFinalSchema, TExtends> {
  const client = typeof opts.client === "object" ? opts.client : {};
  const server = typeof opts.server === "object" ? opts.server : {};
  const runtimeEnv = opts.runtimeEnv ?? getDefaultRuntimeEnv();

  return createCoreEnv<
    ClientPrefix,
    TServer,
    TClient,
    TShared,
    TExtends,
    TFinalSchema
  >({
    ...opts,
    client,
    server,
    clientPrefix: CLIENT_PREFIX,
    runtimeEnv,
  });
}
