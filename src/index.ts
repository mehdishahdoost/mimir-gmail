#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerSendTools } from "./tools/send.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerThreadTools } from "./tools/threads.js";
import { registerModifyTools } from "./tools/modify.js";

const server = new McpServer({
  name: "mimir-gmail",
  version: "1.0.0",
});

// Register all tools
registerMessageTools(server);
registerSendTools(server);
registerDraftTools(server);
registerLabelTools(server);
registerThreadTools(server);
registerModifyTools(server);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mimir Gmail MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
