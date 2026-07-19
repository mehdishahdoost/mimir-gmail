import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, buildMimeMessage } from "../gmail.js";

export function registerSendTools(server: McpServer) {
  server.tool(
    "send_email",
    "Send a new email with optional CC, BCC, and attachments",
    {
      to: z.array(z.string()).describe("Recipient email addresses"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      cc: z.array(z.string()).optional().describe("CC recipients"),
      bcc: z.array(z.string()).optional().describe("BCC recipients"),
      mimeType: z
        .enum(["text/plain", "text/html", "multipart/alternative"])
        .optional()
        .describe("Content type (default: text/plain)"),
      htmlBody: z
        .string()
        .optional()
        .describe("HTML body for multipart/alternative messages"),
    },
    async ({ to, subject, body, cc, bcc, mimeType, htmlBody }) => {
      try {
        const gmail = await getGmail();
        const raw = buildMimeMessage(to, subject, body, {
          cc,
          bcc,
          mimeType,
          htmlBody,
        });

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  messageId: response.data.id,
                  threadId: response.data.threadId,
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
              text: `Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "reply_to_message",
    "Reply to a specific email message",
    {
      messageId: z.string().describe("Message ID to reply to"),
      body: z.string().describe("Reply body content"),
      replyAll: z
        .boolean()
        .optional()
        .describe("Reply to all recipients (default: false)"),
    },
    async ({ messageId, body, replyAll = false }) => {
      try {
        const gmail = await getGmail();

        // Get the original message
        const original = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "metadata",
          metadataHeaders: ["From", "To", "Cc", "Subject"],
        });

        const headers = original.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || "";

        const from = getHeader("From");
        const to = replyAll
          ? [
              from,
              ...getHeader("To")
                .split(",")
                .map((s) => s.trim()),
            ]
          : [from];
        const cc = replyAll ? getHeader("Cc").split(",").map((s) => s.trim()) : [];
        const subject = getHeader("Subject").startsWith("Re:")
          ? getHeader("Subject")
          : `Re: ${getHeader("Subject")}`;

        const raw = buildMimeMessage(to, subject, body, {
          cc: cc.length > 0 ? cc : undefined,
          replyToMessageId: messageId,
          inReplyTo: messageId,
        });

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw,
            threadId: original.data.threadId || undefined,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  messageId: response.data.id,
                  threadId: response.data.threadId,
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
              text: `Error replying to message: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "forward_message",
    "Forward an email to new recipients",
    {
      messageId: z.string().describe("Message ID to forward"),
      to: z.array(z.string()).describe("Recipients to forward to"),
      body: z
        .string()
        .optional()
        .describe("Optional additional message to include"),
    },
    async ({ messageId, to, body }) => {
      try {
        const gmail = await getGmail();

        // Get the original message
        const original = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "metadata",
          metadataHeaders: ["From", "Subject"],
        });

        const headers = original.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || "";

        const subject = `Fwd: ${getHeader("Subject")}`;
        const forwardBody = body
          ? `${body}\n\n---------- Forwarded message ----------\nFrom: ${getHeader("From")}\nSubject: ${getHeader("Subject")}\n\n${original.data.snippet}`
          : `---------- Forwarded message ----------\nFrom: ${getHeader("From")}\nSubject: ${getHeader("Subject")}\n\n${original.data.snippet}`;

        const raw = buildMimeMessage(to, subject, forwardBody);

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  messageId: response.data.id,
                  threadId: response.data.threadId,
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
              text: `Error forwarding message: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
