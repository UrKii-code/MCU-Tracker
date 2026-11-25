import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  const appDir = path.join(__dirname, "MCU Tracker");

  app.disable("x-powered-by");

  // Basic security headers compatible with embedded preview iframes
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Serve MCU Tracker static files (index.html, style.css, data/, images/, assets/)
  app.use(express.static(appDir, { index: "index.html" }));

  // Serve index.html on root path
  app.get("/", (_req, res) => {
    res.sendFile(path.join(appDir, "index.html"));
  });

  // Return proper 404 for missing files or unknown routes
  app.use((_req, res) => {
    res.status(404).type("text/plain").send("404 Not Found");
  });

  return app;
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = "0.0.0.0";
  const app = createApp();

  app.listen(PORT, HOST, () => {
    console.log(`MCU Tracker running at http://${HOST}:${PORT}`);
  });
}
