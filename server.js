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

function sendFile(req, res, filePath, stats) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const range = req.headers.range;

  if (range && ext === ".mp4") {
    const fileSize = stats.size;
    const match = range.match(/bytes=(\d*)-(\d*)/);

    if (!match) {
      res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
      res.end();
      return;
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
      res.end();
      return;
    }

    res.writeHead(206, {
      "Content-Type": contentType,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stats.size,
    "Accept-Ranges": ext === ".mp4" ? "bytes" : "none",
    "Cache-Control": "no-cache",
  });

  fs.createReadStream(filePath).pipe(res);
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

      fs.stat(targetPath, (targetStatError, targetStats) => {
        if (targetStatError || !targetStats.isFile()) {
          sendNotFound(res);
          return;
        }

        sendFile(req, res, targetPath, targetStats);
      });
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Local server is running at http://${HOST}:${PORT}`);
});
