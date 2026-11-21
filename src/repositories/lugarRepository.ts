import { abrirBd } from "@/db";
import type { LugarLocal, LugarNuevo, LugarRemoto } from "@/domain/tipos";
import type { RepositorioLugares, RepositorioSync } from "@/services/ports";

type ParametroSql = string | number | null;

export type BaseDatos = {
  getAllAsync: <T>(sql: string, ...parametros: ParametroSql[]) => Promise<T[]>;
  getFirstAsync: <T>(sql: string, ...parametros: ParametroSql[]) => Promise<T | null>;
  runAsync: (
    sql: string,
    ...parametros: ParametroSql[]
  ) => Promise<{ lastInsertRowId: number; changes: number }>;
};

type FilaLugar = {
  id: number;
  remote_id: string | null;
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  foto_uri: string | null;
  foto_url: string | null;
  publico: number;
  creado_en: string;
  updated_at: string | null;
  deleted: number;
  pending: number;
};

const COLUMNAS = `id, remote_id, nombre, categoria, lat, lng, altitud_m, nota, foto_uri,
  foto_url, publico, creado_en, updated_at, deleted, pending`;

const CLAVE_SINCE = "ultima_sincronizacion";

function aLugarLocal(fila: FilaLugar): LugarLocal {
  return {
    id: fila.id,
    remote_id: fila.remote_id ?? "",
    nombre: fila.nombre,
    categoria: fila.categoria,
    lat: fila.lat,
    lng: fila.lng,
    altitud_m: fila.altitud_m,
    nota: fila.nota,
    foto_uri: fila.foto_uri,
    foto_url: fila.foto_url,
    publico: fila.publico === 1,
    creado_en: fila.creado_en,
    updated_at: fila.updated_at ?? fila.creado_en,
    deleted: fila.deleted === 1,
    pending: fila.pending === 1,
  };
}

function datosRemotosAInsertar(item: LugarRemoto) {
  return [
    item.id,
    item.nombre,
    item.categoria,
    item.lat,
    item.lng,
    item.altitud_m,
    item.nota,
    item.foto_url,
    item.publico ? 1 : 0,
    item.created_at || item.updated_at,
    item.updated_at,
    item.deleted_at ? 1 : 0,
  ] as const;
}

export function crearRepositorioLugares(obtenerBd: () => Promise<BaseDatos>) {
  const listar = async (): Promise<LugarLocal[]> => {
    const bd = await obtenerBd();
    const filas = await bd.getAllAsync<FilaLugar>(
      `SELECT ${COLUMNAS} FROM lugar WHERE deleted = 0 ORDER BY creado_en DESC, id DESC`,
    );
    return filas.map(aLugarLocal);
  };

  const buscar = async (texto: string): Promise<LugarLocal[]> => {
    const bd = await obtenerBd();
    const patron = `%${texto.trim()}%`;
    const filas = await bd.getAllAsync<FilaLugar>(
      `SELECT ${COLUMNAS} FROM lugar
       WHERE deleted = 0 AND (nombre LIKE ? OR nota LIKE ?)
       ORDER BY creado_en DESC, id DESC`,
      patron,
      patron,
    );
    return filas.map(aLugarLocal);
  };

  const obtener = async (id: number): Promise<LugarLocal | null> => {
    const bd = await obtenerBd();
    const fila = await bd.getFirstAsync<FilaLugar>(
      `SELECT ${COLUMNAS} FROM lugar WHERE id = ?`,
      id,
    );
    return fila ? aLugarLocal(fila) : null;
  };

  const insertar = async (datos: LugarNuevo): Promise<number> => {
    const bd = await obtenerBd();
    const resultado = await bd.runAsync(
      `INSERT INTO lugar (remote_id, nombre, categoria, lat, lng, altitud_m, nota,
        foto_uri, foto_url, publico, creado_en, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      datos.remote_id,
      datos.nombre,
      datos.categoria,
      datos.lat,
      datos.lng,
      datos.altitud_m,
      datos.nota,
      datos.foto_uri,
      datos.foto_url,
      datos.publico ? 1 : 0,
      datos.updated_at,
      datos.updated_at,
    );
    return resultado.lastInsertRowId;
  };

  const marcarBorrado = async (id: number, updatedAt: string): Promise<void> => {
    const bd = await obtenerBd();
    await bd.runAsync(
      "UPDATE lugar SET deleted = 1, pending = 1, updated_at = ? WHERE id = ?",
      updatedAt,
      id,
    );
  };

  const cambiarPublico = async (
    id: number,
    publico: boolean,
    updatedAt: string,
  ): Promise<void> => {
    const bd = await obtenerBd();
    await bd.runAsync(
      "UPDATE lugar SET publico = ?, pending = 1, updated_at = ? WHERE id = ?",
      publico ? 1 : 0,
      updatedAt,
      id,
    );
  };

  const pendientes = async (): Promise<LugarLocal[]> => {
    const bd = await obtenerBd();
    const filas = await bd.getAllAsync<FilaLugar>(
      `SELECT ${COLUMNAS} FROM lugar
       WHERE pending = 1 AND remote_id IS NOT NULL
       ORDER BY updated_at ASC, id ASC`,
    );
    return filas.map(aLugarLocal);
  };

  const marcarSincronizado = async (remoteId: string, updatedAt: string): Promise<void> => {
    const bd = await obtenerBd();
    await bd.runAsync(
      "UPDATE lugar SET pending = 0, updated_at = ? WHERE remote_id = ?",
      updatedAt,
      remoteId,
    );
  };

  /** Upsert con "gana la última escritura": solo aplica si el remoto es más nuevo. */
  const aplicarRemoto = async (item: LugarRemoto): Promise<void> => {
    const bd = await obtenerBd();
    await bd.runAsync(
      `INSERT INTO lugar (remote_id, nombre, categoria, lat, lng, altitud_m, nota,
        foto_uri, foto_url, publico, creado_en, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(remote_id) DO UPDATE SET
         nombre = excluded.nombre,
         categoria = excluded.categoria,
         lat = excluded.lat,
         lng = excluded.lng,
         altitud_m = excluded.altitud_m,
         nota = excluded.nota,
         foto_url = excluded.foto_url,
         publico = excluded.publico,
         updated_at = excluded.updated_at,
         deleted = excluded.deleted,
         pending = 0
       WHERE excluded.updated_at >= lugar.updated_at`,
      ...datosRemotosAInsertar(item),
    );
  };

  const contarPendientes = async (): Promise<number> => {
    const bd = await obtenerBd();
    const fila = await bd.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) AS total FROM lugar WHERE pending = 1 AND deleted = 0",
    );
    return fila?.total ?? 0;
  };

  const leerMeta = async (clave: string): Promise<string | null> => {
    const bd = await obtenerBd();
    const fila = await bd.getFirstAsync<{ valor: string }>(
      "SELECT valor FROM meta WHERE clave = ?",
      clave,
    );
    return fila?.valor ?? null;
  };

  const escribirMeta = async (clave: string, valor: string): Promise<void> => {
    const bd = await obtenerBd();
    await bd.runAsync(
      `INSERT INTO meta (clave, valor) VALUES (?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
      clave,
      valor,
    );
  };

  const repositorio: RepositorioLugares & RepositorioSync = {
    listar,
    buscar,
    obtener,
    insertar,
    marcarBorrado,
    cambiarPublico,
    pendientes,
    marcarSincronizado,
    aplicarRemoto,
    contarPendientes,
    leerMeta,
    escribirMeta,
  };
  return repositorio;
}

export const repositorioLugares = crearRepositorioLugares(() => abrirBd());
export const CLAVE_ULTIMA_SINCRONIZACION = CLAVE_SINCE;
