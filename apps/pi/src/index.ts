import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerCommand } from "./define-command.js";
import { disconnectFromHost } from "./host-client.js";
import { alertBrowserCommand } from "./define-command.js";
import { openBrowserAlertTool } from "./define-tool.js";

export default function browserAlert(pi: ExtensionAPI): void {
  registerCommand(pi, alertBrowserCommand);
  pi.registerTool(openBrowserAlertTool);
  pi.on?.("session_shutdown", disconnectFromHost);
}
