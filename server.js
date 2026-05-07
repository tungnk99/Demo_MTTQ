const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 - File not found");
}

function sendServerError(res, error) {
  res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`500 - Internal Server Error\n${error.message}`);
}

function safePathFromUrl(requestUrl) {
  const parsed = new URL(requestUrl, "http://localhost");
  const pathname = decodeURIComponent(parsed.pathname);
  const normalized = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  const relativePath = normalized === path.sep ? "index.html" : normalized.slice(1);
  const fullPath = path.join(ROOT_DIR, relativePath);

  if (!fullPath.startsWith(ROOT_DIR)) {
    return null;
  }

  return fullPath;
}

const server = http.createServer((req, res) => {
  try {
    if (!req.url) {
      sendNotFound(res);
      return;
    }

    const filePath = safePathFromUrl(req.url);
    if (!filePath) {
      sendNotFound(res);
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError) {
        sendNotFound(res);
        return;
      }

      const targetPath = stats.isDirectory()
        ? path.join(filePath, "index.html")
        : filePath;

      fs.readFile(targetPath, (readError, data) => {
        if (readError) {
          sendNotFound(res);
          return;
        }

        const ext = path.extname(targetPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
        });
        res.end(data);
      });
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Local server is running at http://${HOST}:${PORT}`);
});
