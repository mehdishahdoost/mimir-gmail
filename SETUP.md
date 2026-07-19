# Google Cloud Setup Guide

## Step 1: Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" at the top → "New Project"
3. Name it "mimir-gmail" (or any name)
4. Click "Create"

## Step 2: Enable Gmail API

1. Go to https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Make sure your new project is selected
3. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: "Mimir Gmail MCP"
   - User support email: your email
   - Developer contact: your email
   - Save and continue through the steps
4. Back to "Create Credentials" → "OAuth client ID"
5. Application type: **Desktop app**
6. Name: "Mimir Gmail MCP"
7. Click "Create"
8. **Copy the Client ID and Client Secret**

## Step 4: Set Environment Variables

```bash
export GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

## Step 5: Authenticate

```bash
npx mimir-gmail auth
```

The browser will open Google's login page. Sign in and grant permissions.
