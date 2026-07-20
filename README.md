<p align="center">
  <img src="assets/logo.png" alt="Mimir Logo" width="400">
</p>

# Mimir Gmail MCP Server

[![npm version](https://img.shields.io/npm/v/mimir-gmail.svg)](https://www.npmjs.com/package/mimir-gmail)
[![npm downloads](https://img.shields.io/npm/dm/mimir-gmail.svg)](https://www.npmjs.com/package/mimir-gmail)
[![license](https://img.shields.io/npm/l/mimir-gmail.svg)](https://github.com/wbh/mimir-gmail/blob/main/LICENSE)

A Model Context Protocol (MCP) server that gives AI assistants full access to Gmail — read, send, search, draft, label, and manage emails through natural language.

## Quick Install

```bash
npx mimir-gmail auth    # Authenticate with Google
npx mimir-gmail         # Start the MCP server
```

Or install globally:

```bash
npm install -g mimir-gmail
mimir-gmail auth
mimir-gmail
```

## Features

- **18 tools** covering email, drafts, labels, threads, and state management
- **Gmail search syntax** — use operators like `from:`, `subject:`, `has:attachment`, `after:`
- **Thread support** — read entire conversation threads
- **Label management** — create, rename, delete labels
- **Batch operations** — mark read/unread, archive, star multiple messages at once

## Quick Start

### 1. Set up Google OAuth credentials

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)

> **⚠️ Important:** You MUST enable the Gmail API or the server will fail with "Connection closed" error.
> Go to https://console.cloud.google.com/apis/library/gmail.googleapis.com and click **Enable**.
> Wait 1-2 minutes for the change to propagate before proceeding.

3. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth client ID**
6. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: anything (e.g. "Mimir Gmail")
   - Add your email as developer contact
7. Create OAuth client ID → **Desktop app**
8. Copy the **Client ID** and **Client Secret**

### 2. Set environment variables

```bash
export GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

Or create a `.env` file (see `.env.example`):

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Authenticate

```bash
npx mimir-gmail auth
```

This opens your browser to Google's login page. Sign in and grant permissions. Tokens are stored at `~/.mimir-gmail/token.json`.

### 4. Connect to your MCP client

Add to your MCP client config (Claude Desktop, MiMo Code, etc.):

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["mimir-gmail"],
      "env": {
        "GOOGLE_OAUTH_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_OAUTH_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### 5. Start using it

Ask your AI assistant to:
- "Show me my latest emails"
- "Search for emails from john@example.com about the project"
- "Reply to the email with subject 'Meeting Tomorrow'"
- "Draft an email to the team about the release"
- "Archive all read emails older than a week"

## Available Tools

### Email Operations

| Tool | Description |
|------|-------------|
| `read_message` | Read a specific email by ID — returns headers, body, attachment metadata |
| `search_messages` | Search using Gmail query syntax with pagination |
| `list_messages` | List messages in a label/folder (INBOX, SENT, custom labels) |
| `send_email` | Send a new email with to, cc, bcc, subject, body |
| `reply_to_message` | Reply to a specific message (supports reply-all) |
| `forward_message` | Forward an email to new recipients |

### Draft Management

| Tool | Description |
|------|-------------|
| `create_draft` | Create a draft email without sending |
| `update_draft` | Update an existing draft with new content |
| `delete_draft` | Delete a draft |
| `list_drafts` | List all drafts with metadata |

### Label Management

| Tool | Description |
|------|-------------|
| `list_labels` | List all labels (system + user-defined) with counts |
| `create_label` | Create a new label with visibility settings |
| `update_label` | Rename an existing label |
| `delete_label` | Delete a user-defined label |

### Thread & State Management

| Tool | Description |
|------|-------------|
| `list_threads` | List conversation threads with message counts |
| `read_thread` | Read all messages in a thread |
| `mark_read` | Mark message(s) as read |
| `mark_unread` | Mark message(s) as unread |
| `star_message` | Star or unstar a message |
| `archive_message` | Archive message(s) (remove from INBOX) |
| `trash_message` | Move message(s) to trash |
| `untrash_message` | Restore message(s) from trash |
| `modify_labels` | Add or remove labels from message(s) |

## Gmail Search Syntax

The `search_messages` tool supports Gmail's powerful search operators:

| Operator | Example | Description |
|----------|---------|-------------|
| `from:` | `from:john@example.com` | Emails from a specific sender |
| `to:` | `to:mary@example.com` | Emails sent to a recipient |
| `subject:` | `subject:"meeting notes"` | Subject contains text |
| `has:attachment` | `has:attachment` | Emails with attachments |
| `after:` | `after:2024/01/01` | Received after a date |
| `before:` | `before:2024/02/01` | Received before a date |
| `is:` | `is:unread` | Filter by status (unread, read, starred) |
| `label:` | `label:work` | Filter by label |
| `in:` | `in:trash` | Filter by location (inbox, trash, spam) |
| `size:` | `size:10M` | Filter by size |

Combine operators: `from:john@example.com after:2024/01/01 has:attachment`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Set credentials
export GOOGLE_OAUTH_CLIENT_ID="your-client-id"
export GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"

# Run auth flow
npm run auth

# Start MCP server
npm start
```

### Project Structure

```
src/
├── index.ts          # MCP server entry point
├── cli.ts            # CLI for auth flow
├── auth.ts           # OAuth2 token management
├── gmail.ts          # Gmail API helpers
├── oauth-client.ts   # OAuth credential loading
├── types.ts          # Zod schemas for all tools
└── tools/
    ├── messages.ts   # read, search, list messages
    ├── send.ts       # send, reply, forward
    ├── drafts.ts     # create, update, delete, list drafts
    ├── labels.ts     # create, update, delete, list labels
    ├── threads.ts    # list, read threads
    └── modify.ts     # mark read/unread, star, archive, trash, labels
```

## Troubleshooting

### MCP server fails with "Connection closed" error

This usually means one of:

1. **Gmail API not enabled** — Go to https://console.cloud.google.com/apis/library/gmail.googleapis.com and click **Enable**
2. **Missing environment variables** — Ensure `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set
3. **Not authenticated** — Run `npx mimir-gmail auth` to complete the OAuth flow

### "Gmail API has not been used in project" error

Enable the Gmail API at:
```
https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=YOUR_PROJECT_ID
```

## Security

- OAuth credentials are provided by you via environment variables — nothing is hardcoded
- OAuth tokens are stored locally at `~/.mimir-gmail/token.json`
- Tokens never leave your machine
- Auto-refresh on expiry
- Revoke access anytime at https://myaccount.google.com/permissions
- `.env` is gitignored to prevent accidental credential commits

## License

MIT
