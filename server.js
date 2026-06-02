const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { initDatabase, getDbPath } = require("./lib/db");
const { handleApi } = require("./lib/api");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

initDatabase();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function safePath(urlPath) {
  let cleanPath;
  try {
    cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }

  const requested = cleanPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]+/, "");
  const fullPath = path.resolve(PUBLIC_DIR, requested);
  const relative = path.relative(PUBLIC_DIR, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return fullPath;
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || "/").split("?")[0];

  if (urlPath.startsWith("/api/")) {
    if (urlPath === "/api/info") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(JSON.stringify({
        port: PORT,
        local: `http://localhost:${PORT}`,
        lan: getLanUrls(),
        storage: {
          backend: "sqlite",
          database: getDbPath()
        }
      }));
      return;
    }

    const handled = await handleApi(req, res, urlPath);
    if (handled) return;
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const filePath = safePath(req.url || "/");

  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

function getLanUrls() {
  const urls = [];
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        urls.push(`http://${entry.address}:${PORT}`);
      }
    }
  }

  return urls;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("\nCream Chess LAN Bot is running.");
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(`Database: ${getDbPath()}`);

  const lanUrls = getLanUrls();
  if (lanUrls.length > 0) {
    console.log("LAN:");
    for (const url of lanUrls) {
      console.log(`          ${url}`);
    }
  } else {
    console.log("LAN:      No non-internal IPv4 address found.");
  }

  console.log("\nProfiles are saved to SQLite on this machine.");
  console.log("Other devices on the LAN use the same database when they connect here.\n");
});
