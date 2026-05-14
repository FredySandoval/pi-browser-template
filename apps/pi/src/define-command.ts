import type { ExtensionAPI, RegisteredCommand } from "@earendil-works/pi-coding-agent";
import { NativeMessageType } from "@repo/native-messaging-schemas";
import { openBrowserAlertAndWait } from "./host-client.js";
export const DEFAULT_MESSAGE = "Pi is connected to the browser.";

export type CommandDefinition = {
  name: string;
  options: Omit<RegisteredCommand, "name" | "sourceInfo">;
};

export function defineCommand(command: CommandDefinition): CommandDefinition {
  return command;
}

export function registerCommand(pi: ExtensionAPI, command: CommandDefinition): void {
  pi.registerCommand(command.name, command.options);
}

function getAlertMessage(result: Awaited<ReturnType<typeof openBrowserAlertAndWait>>): {
  message: string;
  level: "info" | "error";
} {
  if (result.type === NativeMessageType.AlertShown) {
    return {
      message: `Browser alert shown${result.url ? ` in ${result.url}` : ""}.`,
      level: "info",
    };
  }
  return {
    message: `Browser alert failed: ${result.reason ?? "Unknown error"}`,
    level: "error",
  };
}

export const alertBrowserCommand = defineCommand({
  name: "alert-browser",
  options: {
    description: "Show a browser alert",
    async handler(args, ctx) {
      try {
        const result = await openBrowserAlertAndWait(args.trim() || DEFAULT_MESSAGE);
        const { message, level } = getAlertMessage(result);
        ctx.ui.notify(message, level);
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  },
});
