declare module "@mariozechner/pi-coding-agent" {
  export type CommandContext = {
    hasUI?: boolean;
    ui?: {
      notify?: (message: string, level: "info" | "error") => void;
      setStatus?: (source: string, message: string) => void;
    };
  };

  export type ToolResult = {
    content: Array<{ type: "text"; text: string }>;
  };

  export type ToolDefinition = {
    name: string;
    label: string;
    description: string;
    promptSnippet: string;
    parameters: unknown;
    execute: (
      toolCallId: string,
      params: unknown,
      signal: AbortSignal,
      onUpdate: (update: unknown) => void,
      ctx: CommandContext,
    ) => Promise<ToolResult>;
  };

  export type ExtensionAPI = {
    registerCommand: (name: string, command: { description: string; handler: (args: string, ctx: CommandContext) => unknown }) => void;
    registerTool: (tool: ToolDefinition) => void;
    sendUserMessage: (message: string) => void;
  };
}
