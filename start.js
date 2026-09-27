/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync } = require("node:fs");
const { join } = require("node:path");

// Load the private production-local file first; existing process variables win.
for (const filename of [".env.production.local", ".env.production", ".env"]) {
  const target = join(__dirname, filename);
  if (existsSync(target)) process.loadEnvFile(target);
}

process.env.NODE_ENV = "production";
const next = require("next");
const { createServer } = require("node:http");

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "127.0.0.1";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`OASPE server listening on ${hostname}:${port}`);
  });
}).catch((error) => {
  console.error("OASPE server failed to start.");
  console.error(error instanceof Error ? error.message : "Unknown startup error");
  process.exit(1);
});
