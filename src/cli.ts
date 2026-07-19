#!/usr/bin/env node

import * as http from "http";
import * as url from "url";
import { getAuthUrl, exchangeCode } from "./auth.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "auth") {
    await runAuth();
  } else {
    // Default: run MCP server
    await import("./index.js");
  }
}

async function runAuth() {
  const authUrl = getAuthUrl();
  
  console.log("\n🔐 Gmail MCP Server - Authentication\n");
  console.log("Opening browser for Google authentication...");
  console.log(`\nIf the browser doesn't open, visit:\n${authUrl}\n`);
  
  // Try to open browser
  try {
    const { exec } = await import("child_process");
    const platform = process.platform;
    const command =
      platform === "darwin"
        ? `open "${authUrl}"`
        : platform === "win32"
        ? `start "${authUrl}"`
        : `xdg-open "${authUrl}"`;
    
    exec(command, (error) => {
      if (error) {
        console.log("Could not open browser automatically.");
        console.log("Please open the URL above in your browser.\n");
      }
    });
  } catch {
    console.log("Please open the URL above in your browser.\n");
  }

  // Start local server to receive OAuth callback
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || "", true);
    
    if (parsedUrl.pathname === "/oauth2callback") {
      const code = parsedUrl.query.code as string;
      
      if (code) {
        try {
          await exchangeCode(code);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>✅ Authentication Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
              <p>The Gmail MCP server is now ready to use.</p>
            </body>
            </html>
          `);
          console.log("\n✅ Authentication successful! Tokens saved.");
          console.log("You can now use the Gmail MCP server.\n");
          
          // Close server after successful auth
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(`
            <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>❌ Authentication Failed</h1>
              <p>Error: ${error instanceof Error ? error.message : "Unknown error"}</p>
            </body>
            </html>
          `);
          console.error("\n❌ Authentication failed:", error);
          server.close();
          process.exit(1);
        }
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`
          <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ No authorization code received</h1>
          </body>
          </html>
        `);
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.listen(3000, () => {
    console.log("Waiting for authentication callback on port 3000...");
    console.log("(This will timeout after 5 minutes)\n");
  });

  // Timeout after 5 minutes
  setTimeout(() => {
    console.error("\n⏰ Authentication timed out after 5 minutes.");
    server.close();
    process.exit(1);
  }, 5 * 60 * 1000);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
