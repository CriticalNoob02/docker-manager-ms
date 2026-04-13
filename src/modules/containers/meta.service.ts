import db from "../../config/database";

interface ContainerMeta {
  container_id: string;
  description: string;
  updated_at: number;
}

const stmtGet = db.prepare<[string], ContainerMeta>(
  "SELECT * FROM container_meta WHERE container_id = ?"
);

const stmtGetAll = db.prepare<[], ContainerMeta>(
  "SELECT * FROM container_meta"
);

const stmtUpsert = db.prepare<[string, string, number]>(
  "INSERT OR REPLACE INTO container_meta (container_id, description, updated_at) VALUES (?, ?, ?)"
);

export function getMeta(containerId: string): ContainerMeta | undefined {
  return stmtGet.get(containerId);
}

export function getAllMeta(): Record<string, string> {
  const rows = stmtGetAll.all();
  return Object.fromEntries(rows.map((r) => [r.container_id, r.description]));
}

export function upsertDescription(containerId: string, description: string): void {
  stmtUpsert.run(containerId, description, Date.now());
}
