import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, formatMessage } from "../gmail.js";

const UNREAD_LABEL_ID = "UNREAD";
const UNREAD_QUERY_TOKEN = "is:unread";

export function normalizeListMessageFilters(
  labelId: string,
  query?: string
): { labelIds: string[]; query?: string } {
  const labelIds = new Set([labelId]);
  const normalizedTokens = splitSearchQuery(query || "");
  const queryTokens: string[] = [];

  for (const token of normalizedTokens) {
    if (!token.quoted && token.text.toLowerCase() === UNREAD_QUERY_TOKEN) {
      labelIds.add(UNREAD_LABEL_ID);
      continue;
    }

    queryTokens.push(token.text);
  }

  const normalizedQuery = queryTokens.join(" ").trim();
  return {
    labelIds: [...labelIds],
    query: normalizedQuery || undefined,
  };
}

function splitSearchQuery(query: string): Array<{ text: string; quoted: boolean }> {
  const tokens: Array<{ text: string; quoted: boolean }> = [];
  let current = "";
  let inQuote = false;
  let tokenQuoted = false;

  for (const char of query.trim()) {
    if (char === '"') {
      inQuote = !inQuote;
      tokenQuoted = true;
      current += char;
      continue;
    }

    if (/\s/.test(char) && !inQuote) {
      if (current) {
        tokens.push({ text: current, quoted: tokenQuoted });
        current = "";
        tokenQuoted = false;
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push({ text: current, quoted: tokenQuoted });
  }

  return tokens;
}

export function createEstimatedListResult<T>(
  messages: T[],
  nextPageToken?: string | null,
  resultSizeEstimate?: number | null
) {
  const countMetadata = {
    value: resultSizeEstimate || 0,
    type: "estimate" as const,
    source: "gmail.resultSizeEstimate",
  };

  return {
    messages,
    nextPageToken,
    resultSizeEstimate: countMetadata.value,
    countMetadata,
    totalResults: countMetadata.value,
  };
}

export function registerMessageTools(server: McpServer) {
  server.tool(
    "count_messages",
    "Count messages matching a query without fetching full results. Returns exact count for simple queries like 'is:unread'",
    {
      query: z
        .string()
        .describe(
          "Gmail search query (e.g. 'is:unread', 'from:john@example.com')"
        ),
    },
    async ({ query }) => {
      try {
        const gmail = await getGmail();

        // For simple queries like "is:unread", use the label count API
        if (query === "is:unread") {
          const labelResponse = await gmail.users.labels.get({
            userId: "me",
            id: "UNREAD",
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  query,
                  count: labelResponse.data.messagesTotal || 0,
                  type: "label_count",
                }),
              },
            ],
          };
        }

        // For other queries, paginate through results to count
        let count = 0;
        let pageToken: string | undefined = undefined;
        let hasMore = true;

        while (hasMore) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listResponse: any = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 500,
            pageToken,
          });

          count += (listResponse.data.messages || []).length;
          pageToken = listResponse.data.nextPageToken || undefined;
          hasMore = !!pageToken;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query,
                count,
                type: "exact_count",
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error counting messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

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
        const filters = normalizeListMessageFilters(labelId, query);
        const response = await gmail.users.messages.list({
          userId: "me",
          labelIds: filters.labelIds,
          q: filters.query,
          maxResults,
          pageToken: pageToken || undefined,
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
          const result = createEstimatedListResult(
            [],
            response.data.nextPageToken,
            response.data.resultSizeEstimate
          );

          return {
            content: [
              { type: "text", text: JSON.stringify(result, null, 2) },
            ],
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

        const result = createEstimatedListResult(
          summaries.filter(Boolean),
          response.data.nextPageToken,
          response.data.resultSizeEstimate
        );

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
