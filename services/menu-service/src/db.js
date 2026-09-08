import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(
    fileURLToPath(import.meta.url)
);

// Store SQLite database in ../data
const dbDir =
    process.env.DB_DIR ||
    path.join(__dirname, "../data");

// Create directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(
    dbDir,
    "menu.sqlite"
);

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");


// Create menu table
db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL,
        category TEXT NOT NULL DEFAULT 'Mains',
        available INTEGER NOT NULL DEFAULT 1
    );
`);

export default db;