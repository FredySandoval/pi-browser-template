export function isRestrictedUrl(url?: string): boolean {
  return !url || /^(chrome|chrome-extension|edge|about|devtools|view-source):/.test(url);
}
