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
    console.error("\n❌ Missing Google OAuth credentials.\n");
    console.error("Set them with:\n");
    console.error("  export GOOGLE_OAUTH_CLIENT_ID='your-client-id.apps.googleusercontent.com'");
    console.error("  export GOOGLE_OAUTH_CLIENT_SECRET='your-client-secret'\n");
    console.error("To create credentials:");
    console.error("  1. Go to https://console.cloud.google.com/");
    console.error("  2. Create a project and enable Gmail API");
    console.error("  3. Go to APIs & Services → Credentials");
    console.error("  4. Create OAuth 2.0 Client ID → Desktop app\n");
    process.exit(1);
  }
}
