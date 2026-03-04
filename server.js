import express from "express";
import Database from "better-sqlite3";
import { readdirSync } from "fs";
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

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

