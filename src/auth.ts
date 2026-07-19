import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES, validateCredentials } from "./oauth-client.js";

const TOKEN_DIR = path.join(os.homedir(), ".mimir-gmail");
const TOKEN_PATH = path.join(TOKEN_DIR, "token.json");

export function getOAuth2Client(): OAuth2Client {
  validateCredentials();
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const oauth2Client = getOAuth2Client();
  const tokens = await loadTokens();

  if (!tokens) {
    throw new Error(
      "Not authenticated. Run 'npx mimir-gmail auth' to authenticate with Google."
    );
  }

  oauth2Client.setCredentials(tokens);

  // Auto-refresh if token is expired
  oauth2Client.on("tokens", (newTokens) => {
    if (newTokens.refresh_token) {
      saveTokens({
        access_token: newTokens.access_token || tokens.access_token,
        refresh_token: newTokens.refresh_token,
        scope: newTokens.scope || tokens.scope,
        token_type: newTokens.token_type || tokens.token_type,
        expiry_date: newTokens.expiry_date || tokens.expiry_date,
      });
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export async function loadTokens(): Promise<TokenData | null> {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const data = fs.readFileSync(TOKEN_PATH, "utf-8");
      return JSON.parse(data) as TokenData;
    }
  } catch (err) {
    console.error("Error loading tokens:", err);
  }
  return null;
}

export async function saveTokens(tokens: TokenData): Promise<void> {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.error(`Tokens saved to ${TOKEN_PATH}`);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCode(code: string): Promise<TokenData> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to obtain tokens");
  }

  const tokenData: TokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || SCOPES.join(" "),
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };

  await saveTokens(tokenData);
  return tokenData;
}
