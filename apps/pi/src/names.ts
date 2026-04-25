export function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function safeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function toTitle(name: string): string {
  return name
    .replace(/^@[^/]+\//, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
