import Database from "better-sqlite3";
import path from "path";
import logger from "./logger";

const dbPath = path.resolve(process.cwd(), "data/meta.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS container_meta (
    container_id TEXT PRIMARY KEY,
    description  TEXT NOT NULL DEFAULT '',
    updated_at   INTEGER NOT NULL
  )
`);

logger.info(`💾 SQLite conectado em ${dbPath}`);

export default db;
