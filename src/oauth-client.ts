// OAuth 2.0 Desktop client credentials
// Users must provide their own credentials via environment variables

export const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
export const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

export const REDIRECT_URI = "http://localhost:3000/oauth2callback";

export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.settings.basic",
];

export function validateCredentials(): void {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables."
    );
  }
}
