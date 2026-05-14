export interface ViteEnv {
  BASE_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}
// wxt prepare is why we needed the schema to tolerate missing WXT env values.
// That schema change is why the interface needed | undefined.
export interface WxtEnv {
  MANIFEST_VERSION?: 2 | 3 | undefined;
  BROWSER?: "chrome" | "firefox" | "safari" | "edge" | "opera" | undefined;
  CHROME?: boolean | undefined;
  FIREFOX?: boolean | undefined;
  SAFARI?: boolean | undefined;
  EDGE?: boolean | undefined;
  OPERA?: boolean | undefined;
}
