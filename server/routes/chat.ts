import { Router } from "express";
import Database from "better-sqlite3";

const router = Router();
const db = new Database("database.sqlite", { fileMustExist: false });

router.get("/history", (req, res) => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const rows = db.prepare(`
      SELECT id, user_id, content, created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    res.json({ items: rows });
  } catch (e: any) {
    console.error("GET /chat/history error:", e);
    res.status(500).json({ error: "failed_to_fetch_history" });
  }
});

export default router;

