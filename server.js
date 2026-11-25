import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const appDir = path.join(__dirname, "MCU Tracker");

// Serve unified MCU Tracker directory (index.html, style.css, data/, images/, assets/)
app.use(express.static(appDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(appDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`MCU Tracker running at http://${HOST}:${PORT}`);
});
