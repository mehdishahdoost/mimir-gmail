import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, formatMessage } from "../gmail.js";

export function registerThreadTools(server: McpServer) {
  server.tool(
    "list_threads",
    "List conversation threads with optional label and search filters",
    {
      labelId: z
        .string()
        .optional()
        .describe("Label ID to filter by (default: INBOX)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of threads (default: 10)"),
      pageToken: z.string().optional().describe("Page token for pagination"),
      query: z.string().optional().describe("Additional search query filter"),
    },
    async ({ labelId = "INBOX", maxResults = 10, pageToken, query }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.threads.list({
          userId: "me",
          labelIds: [labelId],
          q: query || undefined,
          maxResults,
          pageToken: pageToken || undefined,
        });

        const threads = response.data.threads || [];
        if (threads.length === 0) {
          return {
            content: [{ type: "text", text: "No threads found." }],
          };
        }

        // Fetch thread summaries
        const summaries = await Promise.all(
          threads.map(async (thread) => {
            if (!thread.id) return null;
            const full = await gmail.users.threads.get({
              userId: "me",
              id: thread.id,
              format: "metadata",
              metadataHeaders: ["From", "Subject", "Date"],
            });

            const messages = full.data.messages || [];
            const lastMessage = messages[messages.length - 1];
            const headers = lastMessage?.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
                ?.value || "";

            return {
              id: full.data.id,
              subject: getHeader("Subject"),
              from: getHeader("From"),
              date: getHeader("Date"),
              messageCount: messages.length,
              snippet: full.data.snippet,
              isUnread: full.data.messages?.some((m) =>
                m.labelIds?.includes("UNREAD")
              ),
            };
          })
        );

        const result = {
          threads: summaries.filter(Boolean),
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
              text: `Error listing threads: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "read_thread",
    "Read all messages in a conversation thread",
    {
      threadId: z.string().describe("Thread ID to read"),
    },
    async ({ threadId }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "full",
        });

        const thread = response.data;
        if (!thread.messages || thread.messages.length === 0) {
          return {
            content: [{ type: "text", text: "Thread has no messages." }],
          };
        }

        const messages = thread.messages.map((msg) => formatMessage(msg));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  threadId: thread.id,
                  messageCount: messages.length,
                  messages,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading thread: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
