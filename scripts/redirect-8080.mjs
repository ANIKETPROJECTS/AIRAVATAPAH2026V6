import { createServer, request as httpRequest } from "http";
import net from "net";

const domain = process.env.REPLIT_DEV_DOMAIN;

if (!domain) {
  console.error("REPLIT_DEV_DOMAIN not set");
  process.exit(1);
}

const APP_PORT = 5000;

function startProxy(port) {
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);

      const forwardHeaders = { ...req.headers };
      delete forwardHeaders["transfer-encoding"];
      delete forwardHeaders["content-encoding"];
      forwardHeaders["host"] = `localhost:${APP_PORT}`;
      if (body.length > 0) {
        forwardHeaders["content-length"] = String(body.length);
      }

      const opts = {
        hostname: "127.0.0.1",
        port: APP_PORT,
        path: req.url,
        method: req.method,
        headers: forwardHeaders,
      };

      const proxy = httpRequest(opts, (upstream) => {
        const responseHeaders = { ...upstream.headers };
        delete responseHeaders["connection"];
        delete responseHeaders["transfer-encoding"];
        if (upstream.headers["content-length"]) {
          responseHeaders["content-length"] = upstream.headers["content-length"];
        }

        res.writeHead(upstream.statusCode, responseHeaders);
        upstream.pipe(res, { end: true });
      });

      proxy.on("error", (err) => {
        console.error(`[Proxy:${port}] Error forwarding ${req.method} ${req.url}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API server is unavailable. Please try again in a moment." }));
        }
      });

      if (body.length > 0) {
        proxy.write(body);
      }
      proxy.end();
    });

    req.on("error", (err) => {
      console.error(`[Proxy:${port}] Request read error:`, err.message);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });

  // Handle WebSocket upgrade (Vite HMR)
  server.on("upgrade", (req, clientSocket, head) => {
    const upstreamSocket = net.connect(APP_PORT, "127.0.0.1", () => {
      const upgradeHeaders = { ...req.headers };
      upgradeHeaders["host"] = `localhost:${APP_PORT}`;

      const requestLine = `${req.method} ${req.url} HTTP/1.1\r\n`;
      const headerLines = Object.entries(upgradeHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n");

      upstreamSocket.write(`${requestLine}${headerLines}\r\n\r\n`);
      if (head && head.length) upstreamSocket.write(head);

      upstreamSocket.pipe(clientSocket, { end: true });
      clientSocket.pipe(upstreamSocket, { end: true });
    });

    upstreamSocket.on("error", (err) => {
      console.error(`[Proxy:${port}] WebSocket upstream error:`, err.message);
      clientSocket.destroy();
    });

    clientSocket.on("error", () => upstreamSocket.destroy());
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Proxy server on port ${port} → localhost:${APP_PORT} (HTTP + WebSocket)`);
  });
}

startProxy(8080);
startProxy(18593);
