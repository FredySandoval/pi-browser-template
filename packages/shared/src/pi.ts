import type { CommandContext } from "@mariozechner/pi-coding-agent";

export type ThemeColor = "success" | "error" | "warning" | "muted" | "dim";

export type PiContext = CommandContext & {
  ui?: CommandContext["ui"] & {
    theme?: {
      fg?: (color: ThemeColor, text: string) => string;
    };
  };
};
