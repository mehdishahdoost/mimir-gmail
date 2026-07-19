import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, buildMimeMessage } from "../gmail.js";

export function registerDraftTools(server: McpServer) {
  server.tool(
    "create_draft",
    "Create a draft email without sending it",
    {
      to: z.array(z.string()).describe("Recipient email addresses"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      cc: z.array(z.string()).optional().describe("CC recipients"),
      bcc: z.array(z.string()).optional().describe("BCC recipients"),
    },
    async ({ to, subject, body, cc, bcc }) => {
      try {
        const gmail = await getGmail();
        const raw = buildMimeMessage(to, subject, body, { cc, bcc });

        const response = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw,
            },
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  draftId: response.data.id,
                  messageId: response.data.message?.id,
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
              text: `Error creating draft: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_draft",
    "Update an existing draft with new content",
    {
      draftId: z.string().describe("Draft ID to update"),
      to: z.array(z.string()).describe("Recipient email addresses"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      cc: z.array(z.string()).optional().describe("CC recipients"),
      bcc: z.array(z.string()).optional().describe("BCC recipients"),
    },
    async ({ draftId, to, subject, body, cc, bcc }) => {
      try {
        const gmail = await getGmail();
        const raw = buildMimeMessage(to, subject, body, { cc, bcc });

        const response = await gmail.users.drafts.update({
          userId: "me",
          id: draftId,
          requestBody: {
            message: {
              raw,
            },
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  draftId: response.data.id,
                  messageId: response.data.message?.id,
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
              text: `Error updating draft: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_draft",
    "Delete a draft email",
    {
      draftId: z.string().describe("Draft ID to delete"),
    },
    async ({ draftId }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.drafts.delete({
          userId: "me",
          id: draftId,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, deleted: draftId }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting draft: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_drafts",
    "List all draft emails",
    {
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of drafts (default: 10)"),
      pageToken: z.string().optional().describe("Page token for pagination"),
    },
    async ({ maxResults = 10, pageToken }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.drafts.list({
          userId: "me",
          maxResults,
          pageToken: pageToken || undefined,
        });

        const drafts = response.data.drafts || [];
        if (drafts.length === 0) {
          return {
            content: [{ type: "text", text: "No drafts found." }],
          };
        }

        // Fetch draft details
        const draftDetails = await Promise.all(
          drafts.map(async (draft) => {
            if (!draft.id) return null;
            const full = await gmail.users.drafts.get({
              userId: "me",
              id: draft.id,
            });

            const headers = full.data.message?.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find(
                (h: { name?: string | null }) =>
                  h.name?.toLowerCase() === name.toLowerCase()
              )?.value || "";

            return {
              id: full.data.id,
              to: getHeader("To"),
              subject: getHeader("Subject"),
              date: getHeader("Date"),
              snippet: full.data.message?.snippet,
            };
          })
        );

        const result = {
          drafts: draftDetails.filter(Boolean),
          nextPageToken: response.data.nextPageToken,
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
              text: `Error listing drafts: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
