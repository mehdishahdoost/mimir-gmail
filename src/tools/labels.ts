import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail } from "../gmail.js";

export function registerLabelTools(server: McpServer) {
  server.tool(
    "list_labels",
    "List all Gmail labels (system and user-defined)",
    {},
    async () => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.labels.list({
          userId: "me",
        });

        const labels = response.data.labels || [];
        const result = labels.map((label) => ({
          id: label.id,
          name: label.name,
          type: label.type,
          messagesTotal: label.messagesTotal,
          messagesUnread: label.messagesUnread,
        }));

        return {
          content: [
            { type: "text", text: JSON.stringify({ labels: result }, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing labels: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_label",
    "Create a new Gmail label",
    {
      name: z.string().describe("Label name"),
      messageListVisibility: z
        .enum(["show", "hide"])
        .optional()
        .describe("Visibility in message list (default: show)"),
      labelListVisibility: z
        .enum(["labelShow", "labelShowIfUnread", "labelHide"])
        .optional()
        .describe("Visibility in label list (default: labelShow)"),
    },
    async ({ name, messageListVisibility = "show", labelListVisibility = "labelShow" }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.labels.create({
          userId: "me",
          requestBody: {
            name,
            messageListVisibility,
            labelListVisibility,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  label: {
                    id: response.data.id,
                    name: response.data.name,
                  },
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
              text: `Error creating label: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_label",
    "Update/rename an existing Gmail label",
    {
      labelId: z.string().describe("Label ID to update"),
      name: z.string().describe("New label name"),
    },
    async ({ labelId, name }) => {
      try {
        const gmail = await getGmail();
        const response = await gmail.users.labels.update({
          userId: "me",
          id: labelId,
          requestBody: {
            name,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  label: {
                    id: response.data.id,
                    name: response.data.name,
                  },
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
              text: `Error updating label: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_label",
    "Delete a user-defined Gmail label (cannot delete system labels)",
    {
      labelId: z.string().describe("Label ID to delete"),
    },
    async ({ labelId }) => {
      try {
        const gmail = await getGmail();
        await gmail.users.labels.delete({
          userId: "me",
          id: labelId,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, deleted: labelId },
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
              text: `Error deleting label: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
