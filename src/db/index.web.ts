import * as SQLite from "expo-sqlite";

import { MIGRACIONES, VERSION_BD } from "./schema";

let conexion: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrar(bd: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await bd.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const versionActual = fila?.user_version ?? 0;
  for (let version = versionActual; version < VERSION_BD; version += 1) {
    const pasos = MIGRACIONES[version];
    if (!pasos) {
      continue;
    }
    await bd.withTransactionAsync(async () => {
      for (const sql of pasos) {
        await bd.execAsync(sql);
      }
    });
  }
  await bd.execAsync(`PRAGMA user_version = ${VERSION_BD};`);
}

/** La vista web usa SQLite en memoria para evitar archivos OPFS y sus handles. */
export function abrirBd(): Promise<SQLite.SQLiteDatabase> {
  conexion ??= SQLite.openDatabaseAsync(":memory:").then(async (bd) => {
    await migrar(bd);
    return bd;
  });
  return conexion;
}
