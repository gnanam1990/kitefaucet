import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.FAUCET_DB ?? resolve(here, "../../faucet.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS drips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    ip TEXT NOT NULL,
    github_id INTEGER,
    kite_amount REAL,
    usdt_amount REAL,
    kite_tx TEXT,
    usdt_tx TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_drips_address ON drips(address);
  CREATE INDEX IF NOT EXISTS idx_drips_ip ON drips(ip);
  CREATE INDEX IF NOT EXISTS idx_drips_gh ON drips(github_id);
  CREATE INDEX IF NOT EXISTS idx_drips_created ON drips(created_at);
`);
