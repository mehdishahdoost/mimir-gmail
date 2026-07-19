import { gmail_v1 } from "googleapis";
import { getGmailClient } from "./auth.js";

let cachedClient: gmail_v1.Gmail | null = null;

export async function getGmail(): Promise<gmail_v1.Gmail> {
  if (!cachedClient) {
    cachedClient = await getGmailClient();
  }
  return cachedClient;
}

// Helper to extract text content from a message part
export function getTextFromPart(part: gmail_v1.Schema$MessagePart): string {
  if (part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }
  
  // Handle multipart messages
  if (part.parts) {
    // Prefer plain text over HTML
    const plainPart = part.parts.find(
      (p) => p.mimeType === "text/plain"
    );
    if (plainPart) {
      return getTextFromPart(plainPart);
    }
    
    // Fall back to HTML
    const htmlPart = part.parts.find(
      (p) => p.mimeType === "text/html"
    );
    if (htmlPart) {
      return getTextFromPart(htmlPart);
    }
    
    // Recurse into nested multipart
    for (const p of part.parts) {
      if (p.parts) {
        const text = getTextFromPart(p);
        if (text) return text;
      }
    }
  }
  
  return "";
}

// Helper to format a message for display
export function formatMessage(message: gmail_v1.Schema$Message): Record<string, unknown> {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
  
  const body = getTextFromPart(message.payload!);
  
  // Extract attachment info
  const attachments = extractAttachments(message.payload!);
  
  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds,
    snippet: message.snippet,
    from: getHeader("From"),
    to: getHeader("To"),
    cc: getHeader("Cc"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    body: body.substring(0, 5000), // Limit body length
    attachments: attachments.length > 0 ? attachments : undefined,
    isUnread: message.labelIds?.includes("UNREAD"),
  };
}

// Helper to extract attachment metadata
function extractAttachments(
  part: gmail_v1.Schema$MessagePart
): Array<{ filename: string; mimeType: string; size: number; attachmentId?: string }> {
  const attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId?: string;
  }> = [];
  
  if (part.filename && part.filename.length > 0) {
    attachments.push({
      filename: part.filename,
      mimeType: part.mimeType || "application/octet-stream",
      size: parseInt(part.body?.size?.toString() || "0", 10),
      attachmentId: part.body?.attachmentId || undefined,
    });
  }
  
  if (part.parts) {
    for (const p of part.parts) {
      attachments.push(...extractAttachments(p));
    }
  }
  
  return attachments;
}

// Helper to build a MIME message
export function buildMimeMessage(
  to: string[],
  subject: string,
  body: string,
  options: {
    cc?: string[];
    bcc?: string[];
    mimeType?: string;
    htmlBody?: string;
    replyToMessageId?: string;
    inReplyTo?: string;
  } = {}
): string {
  const { cc, bcc, mimeType = "text/plain", htmlBody, inReplyTo } = options;
  
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  let mimeMessage = "";
  
  // Headers
  mimeMessage += `To: ${to.join(", ")}\r\n`;
  if (cc && cc.length > 0) mimeMessage += `Cc: ${cc.join(", ")}\r\n`;
  if (bcc && bcc.length > 0) mimeMessage += `Bcc: ${bcc.join(", ")}\r\n`;
  mimeMessage += `Subject: ${subject}\r\n`;
  if (inReplyTo) {
    mimeMessage += `In-Reply-To: ${inReplyTo}\r\n`;
    mimeMessage += `References: ${inReplyTo}\r\n`;
  }
  
  if (mimeType === "multipart/alternative" && htmlBody) {
    mimeMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${body}\r\n\r\n`;
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${htmlBody}\r\n\r\n`;
    mimeMessage += `--${boundary}--`;
  } else if (mimeType === "text/html") {
    mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${htmlBody || body}`;
  } else {
    mimeMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${body}`;
  }
  
  return Buffer.from(mimeMessage).toString("base64url");
}
