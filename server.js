// server.js - Lightweight local server for Wycherley International School Cheque Printer
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 8888;
const functions = {
  "/get-record": require("./netlify/functions/get-record").handler,
  "/oauthStart": require("./netlify/functions/oauthStart").handler,
  "/oauthCallback": require("./netlify/functions/oauthCallback").handler,
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle Netlify Functions locally
  if (pathname.startsWith("/.netlify/functions/")) {
    const fnName = pathname.replace("/.netlify/functions", "");
    const handler = functions[fnName];

    if (handler) {
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        queryStringParameters: parsedUrl.query,
      };

      try {
        const result = await handler(event);
        res.writeHead(result.statusCode || 200, result.headers || { "Content-Type": "application/json" });
        res.end(result.body || "");
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // Handle Static Files (index.html, etc.)
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "index.html");
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
  };

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Wycherley International School Cheque Printer Running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`======================================================\n`);
  
  // Auto-open browser
  const startCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  require("child_process").exec(`${startCmd} http://localhost:${PORT}`);
});
