import { z } from "zod";

// Message schemas
export const SendMessageSchema = z.object({
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
  attachments: z
    .array(z.string())
    .optional()
    .describe("File paths to attach"),
  replyToMessageId: z
    .string()
    .optional()
    .describe("Message ID to reply to"),
  forwardToMessageId: z
    .string()
    .optional()
    .describe("Message ID to forward"),
});

export const ReadMessageSchema = z.object({
  messageId: z.string().describe("Gmail message ID"),
});

export const SearchMessagesSchema = z.object({
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
});

export const ListMessagesSchema = z.object({
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
});

// Draft schemas
export const CreateDraftSchema = z.object({
  to: z.array(z.string()).describe("Recipient email addresses"),
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body content"),
  cc: z.array(z.string()).optional().describe("CC recipients"),
  bcc: z.array(z.string()).optional().describe("BCC recipients"),
});

export const UpdateDraftSchema = z.object({
  draftId: z.string().describe("Draft ID to update"),
  to: z.array(z.string()).describe("Recipient email addresses"),
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body content"),
  cc: z.array(z.string()).optional().describe("CC recipients"),
  bcc: z.array(z.string()).optional().describe("BCC recipients"),
});

export const DeleteDraftSchema = z.object({
  draftId: z.string().describe("Draft ID to delete"),
});

export const ListDraftsSchema = z.object({
  maxResults: z
    .number()
    .optional()
    .describe("Maximum number of drafts (default: 10)"),
  pageToken: z.string().optional().describe("Page token for pagination"),
});

// Label schemas
export const CreateLabelSchema = z.object({
  name: z.string().describe("Label name"),
  messageListVisibility: z
    .enum(["show", "hide"])
    .optional()
    .describe("Visibility in message list (default: show)"),
  labelListVisibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional()
    .describe("Visibility in label list (default: labelShow)"),
});

export const UpdateLabelSchema = z.object({
  labelId: z.string().describe("Label ID to update"),
  name: z.string().describe("New label name"),
});

export const DeleteLabelSchema = z.object({
  labelId: z.string().describe("Label ID to delete"),
});

// Thread schemas
export const ListThreadsSchema = z.object({
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
});

export const ReadThreadSchema = z.object({
  threadId: z.string().describe("Thread ID to read"),
});

// Modify schemas
export const ModifyMessageSchema = z.object({
  messageId: z.string().describe("Message ID to modify"),
});

export const BatchModifySchema = z.object({
  messageIds: z.array(z.string()).describe("Message IDs to modify"),
  addLabelIds: z
    .array(z.string())
    .optional()
    .describe("Label IDs to add"),
  removeLabelIds: z
    .array(z.string())
    .optional()
    .describe("Label IDs to remove"),
});

// Type exports
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type ReadMessage = z.infer<typeof ReadMessageSchema>;
export type SearchMessages = z.infer<typeof SearchMessagesSchema>;
export type ListMessages = z.infer<typeof ListMessagesSchema>;
export type CreateDraft = z.infer<typeof CreateDraftSchema>;
export type UpdateDraft = z.infer<typeof UpdateDraftSchema>;
export type DeleteDraft = z.infer<typeof DeleteDraftSchema>;
export type ListDrafts = z.infer<typeof ListDraftsSchema>;
export type CreateLabel = z.infer<typeof CreateLabelSchema>;
export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;
export type DeleteLabel = z.infer<typeof DeleteLabelSchema>;
export type ListThreads = z.infer<typeof ListThreadsSchema>;
export type ReadThread = z.infer<typeof ReadThreadSchema>;
export type ModifyMessage = z.infer<typeof ModifyMessageSchema>;
export type BatchModify = z.infer<typeof BatchModifySchema>;
