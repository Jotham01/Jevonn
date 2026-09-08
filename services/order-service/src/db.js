import Database from "better-sqlite3";
import { fileURLToPath } from "url"
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dbDir = process.env.DB_DIR || path.join(__dirname, "..")
const dbPath = path.join(dbDir, "orders.sqlite");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name  TEXT    NOT NULL,
        subtotal       REAL    NOT NULL,
        tax            REAL    NOT NULL,
        total          REAL    NOT NULL,
        status         TEXT    NOT NULL DEFAULT 'confirmed',
        created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id      INTEGER NOT NULL,
        menu_item_id  INTEGER NOT NULL,
        name          TEXT    NOT NULL,
        unit_price    REAL    NOT NULL,
        quantity      INTEGER NOT NULL,
        line_total    REAL    NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );
`);

export default db;