import { defineTool } from "@earendil-works/pi-coding-agent";
import { NativeMessageType } from "@repo/native-messaging-schemas";
import { openBrowserAlertAndWait } from "./host-client.js";
import Type from "typebox";
import { DEFAULT_MESSAGE } from "./define-command.js";

const alertParams = Type.Object({
  message: Type.Optional(Type.String()),
});

export const openBrowserAlertTool = defineTool({
  name: "open_browser_alert",
  label: "Open Browser Alert",
  description: "Show alert() in the active browser tab.",
  parameters: alertParams,
  async execute(_id, params, signal) {
    if (signal?.aborted) throw new Error("open_browser_alert aborted");

    const result = await openBrowserAlertAndWait(params.message ?? DEFAULT_MESSAGE);
    if (result.type !== NativeMessageType.AlertShown) throw new Error(result.reason ?? "Browser alert failed");

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      details: result,
    };
  },
});
