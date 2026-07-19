import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail } from "../gmail.js";

export function registerModifyTools(server: McpServer) {
  server.tool(
    "mark_read",
    "Mark message(s) as read by removing the UNREAD label",
    {
      messageIds: z.array(z.string()).describe("Message IDs to mark as read"),
    },
    async ({ messageIds }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            removeLabelIds: ["UNREAD"],
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, markedRead: messageIds.length },
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
              text: `Error marking as read: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "mark_unread",
    "Mark message(s) as unread by adding the UNREAD label",
    {
      messageIds: z
        .array(z.string())
        .describe("Message IDs to mark as unread"),
    },
    async ({ messageIds }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            addLabelIds: ["UNREAD"],
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, markedUnread: messageIds.length },
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
              text: `Error marking as unread: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "star_message",
    "Star or unstar a message",
    {
      messageId: z.string().describe("Message ID to star/unstar"),
      star: z
        .boolean()
        .optional()
        .describe("True to star, false to unstar (default: toggle)"),
    },
    async ({ messageId, star }) => {
      try {
        const gmail = await getGmail();

        // Get current labels
        const message = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "minimal",
        });

        const isStarred = message.data.labelIds?.includes("STARRED");

        // Determine action
        const shouldStar = star !== undefined ? star : !isStarred;

        if (shouldStar && !isStarred) {
          await gmail.users.messages.modify({
            userId: "me",
            id: messageId,
            requestBody: {
              addLabelIds: ["STARRED"],
            },
          });
        } else if (!shouldStar && isStarred) {
          await gmail.users.messages.modify({
            userId: "me",
            id: messageId,
            requestBody: {
              removeLabelIds: ["STARRED"],
            },
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  messageId,
                  starred: shouldStar,
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
              text: `Error starring message: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "archive_message",
    "Archive message(s) by removing from INBOX",
    {
      messageIds: z
        .array(z.string())
        .describe("Message IDs to archive"),
    },
    async ({ messageIds }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            removeLabelIds: ["INBOX"],
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, archived: messageIds.length },
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
              text: `Error archiving messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "trash_message",
    "Move message(s) to trash",
    {
      messageIds: z.array(z.string()).describe("Message IDs to trash"),
    },
    async ({ messageIds }) => {
      try {
        const gmail = await getGmail();
        await Promise.all(
          messageIds.map((id) =>
            gmail.users.messages.trash({
              userId: "me",
              id,
            })
          )
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, trashed: messageIds.length },
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
              text: `Error trashing messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "untrash_message",
    "Restore message(s) from trash",
    {
      messageIds: z.array(z.string()).describe("Message IDs to restore"),
    },
    async ({ messageIds }) => {
      try {
        const gmail = await getGmail();
        await Promise.all(
          messageIds.map((id) =>
            gmail.users.messages.untrash({
              userId: "me",
              id,
            })
          )
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, restored: messageIds.length },
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
              text: `Error restoring messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "modify_labels",
    "Add or remove labels from message(s)",
    {
      messageIds: z.array(z.string()).describe("Message IDs to modify"),
      addLabelIds: z
        .array(z.string())
        .optional()
        .describe("Label IDs to add"),
      removeLabelIds: z
        .array(z.string())
        .optional()
        .describe("Label IDs to remove"),
    },
    async ({ messageIds, addLabelIds, removeLabelIds }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            addLabelIds: addLabelIds || [],
            removeLabelIds: removeLabelIds || [],
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  modified: messageIds.length,
                  addedLabels: addLabelIds || [],
                  removedLabels: removeLabelIds || [],
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
              text: `Error modifying labels: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
