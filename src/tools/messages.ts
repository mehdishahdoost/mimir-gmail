import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, formatMessage } from "../gmail.js";

export function registerMessageTools(server: McpServer) {
  server.tool(
    "read_message",
    "Read a specific email by ID, returning headers, body, and attachment metadata",
    {
      messageId: z.string().describe("Gmail message ID"),
    },
    async ({ messageId }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        const message = response.data;
        if (!message) {
          return { content: [{ type: "text", text: "Message not found" }] };
        }

        const formatted = formatMessage(message);
        return {
          content: [
            { type: "text", text: JSON.stringify(formatted, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading message: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "search_messages",
    "Search emails using Gmail query syntax (from:, subject:, has:attachment, after:, before:, etc.)",
    {
      query: z
        .string()
        .describe(
          "Gmail search query (e.g. 'from:john@example.com subject:meeting has:attachment')"
        ),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of results (default: 10)"),
      pageToken: z.string().optional().describe("Page token for pagination"),
    },
    async ({ query, maxResults = 10, pageToken }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults,
          pageToken: pageToken || undefined,
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
          return {
            content: [{ type: "text", text: "No messages found matching your query." }],
          };
        }

        // Fetch full message details
        const fullMessages = await Promise.all(
          messages.map(async (msg) => {
            if (!msg.id) return null;
            const full = await gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: "metadata",
              metadataHeaders: ["From", "To", "Subject", "Date"],
            });
            return formatMessage(full.data);
          })
        );

        const result = {
          messages: fullMessages.filter(Boolean),
          nextPageToken: response.data.nextPageToken,
          totalResults: response.data.resultSizeEstimate,
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_messages",
    "List messages in a label/folder with pagination support",
    {
      labelId: z
        .string()
        .optional()
        .describe("Label ID to filter by (default: INBOX)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of results (default: 10)"),
      pageToken: z.string().optional().describe("Page token for pagination"),
      query: z.string().optional().describe("Additional search query filter"),
    },
    async ({ labelId = "INBOX", maxResults = 10, pageToken, query }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.messages.list({
          userId: "me",
          labelIds: [labelId],
          q: query || undefined,
          maxResults,
          pageToken: pageToken || undefined,
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
          return {
            content: [{ type: "text", text: "No messages found in this label." }],
          };
        }

        // Fetch message summaries
        const summaries = await Promise.all(
          messages.map(async (msg) => {
            if (!msg.id) return null;
            const full = await gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: "metadata",
              metadataHeaders: ["From", "To", "Subject", "Date"],
            });
            return {
              id: full.data.id,
              threadId: full.data.threadId,
              snippet: full.data.snippet,
              from:
                full.data.payload?.headers?.find(
                  (h) => h.name === "From"
                )?.value || "",
              subject:
                full.data.payload?.headers?.find(
                  (h) => h.name === "Subject"
                )?.value || "",
              date:
                full.data.payload?.headers?.find(
                  (h) => h.name === "Date"
                )?.value || "",
              isUnread: full.data.labelIds?.includes("UNREAD"),
            };
          })
        );

        const result = {
          messages: summaries.filter(Boolean),
          nextPageToken: response.data.nextPageToken,
          totalResults: response.data.resultSizeEstimate,
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
