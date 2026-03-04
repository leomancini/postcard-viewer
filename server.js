import express from "express";
import Database from "better-sqlite3";
import { readdirSync, readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3118;

// SQLite setup
const db = new Database(join(__dirname, "data.sqlite"));
db.pragma("journal_mode = WAL");

app.use(express.json());

// Serve postcard images
app.use("/postcards", express.static(join(__dirname, "postcards")));

// API: list all postcards
app.get("/api/postcards", (req, res) => {
  try {
    const dir = join(__dirname, "postcards");
    const entries = readdirSync(dir, { withFileTypes: true });
    const postcards = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    res.json({ postcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from dist
app.use(express.static(join(__dirname, "dist")));

// API endpoint for SQLite queries
app.post("/api/query", (req, res) => {
  try {
    const { sql, params = [] } = req.body;
    const stmt = db.prepare(sql);
    if (stmt.reader) {
      const rows = stmt.all(...params);
      res.json({ rows });
    } else {
      const result = stmt.run(...params);
      res.json({ result });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SPA fallback with OG tags for postcard pages
app.get("*", (req, res) => {
  const indexPath = join(__dirname, "dist", "index.html");
  const match = req.path.match(/^\/([a-zA-Z0-9]+)$/);
  if (match) {
    const id = match[1];
    const imgPath = join(__dirname, "postcards", id, "front.jpeg");
    if (existsSync(imgPath)) {
      const html = readFileSync(indexPath, "utf-8");
      const ogTags = `<meta property="og:image" content="https://postcard.leo.gd/postcards/${id}/front.jpeg" />\n    <meta property="og:type" content="website" />\n    <meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:image" content="https://postcard.leo.gd/postcards/${id}/front.jpeg" />`;
      return res.send(html.replace("</head>", `    ${ogTags}\n  </head>`));
    }
  }
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

