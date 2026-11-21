/**
 * Migraciones de SQLite. La versión 1 replica el modelo del proyecto y la
 * versión 2 agrega los campos necesarios para sincronizar con la API.
 * `PRAGMA user_version` guarda la versión aplicada.
 */
export const VERSION_BD = 2;

const MIGRACION_1 = [
  `CREATE TABLE IF NOT EXISTS lugar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'otro',
    lat REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng REAL NOT NULL CHECK (lng BETWEEN -180 AND 180),
    altitud_m REAL,
    nota TEXT,
    foto_uri TEXT,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS meta (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );`,
];

const MIGRACION_2 = [
  "ALTER TABLE lugar ADD COLUMN remote_id TEXT;",
  "ALTER TABLE lugar ADD COLUMN foto_url TEXT;",
  "ALTER TABLE lugar ADD COLUMN publico INTEGER NOT NULL DEFAULT 0;",
  "ALTER TABLE lugar ADD COLUMN updated_at TEXT;",
  "ALTER TABLE lugar ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;",
  "ALTER TABLE lugar ADD COLUMN pending INTEGER NOT NULL DEFAULT 1;",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_lugar_remote_id ON lugar(remote_id);",
  "CREATE INDEX IF NOT EXISTS idx_lugar_pending ON lugar(pending);",
];

export const MIGRACIONES: readonly (readonly string[])[] = [MIGRACION_1, MIGRACION_2];
