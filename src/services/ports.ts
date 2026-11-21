import type { DatosRemotos, LugarLocal, LugarNuevo, LugarRemoto } from "@/domain/tipos";

/** Contrato de persistencia local que consumen los servicios. */
export interface RepositorioLugares {
  listar: () => Promise<LugarLocal[]>;
  buscar: (texto: string) => Promise<LugarLocal[]>;
  obtener: (id: number) => Promise<LugarLocal | null>;
  insertar: (datos: LugarNuevo) => Promise<number>;
  marcarBorrado: (id: number, updatedAt: string) => Promise<void>;
  cambiarPublico: (id: number, publico: boolean, updatedAt: string) => Promise<void>;
  contarPendientes: () => Promise<number>;
}

/** Operaciones que necesita la sincronización. */
export interface RepositorioSync {
  pendientes: () => Promise<LugarLocal[]>;
  aplicarRemoto: (item: LugarRemoto) => Promise<void>;
  marcarSincronizado: (remoteId: string, updatedAt: string) => Promise<void>;
  leerMeta: (clave: string) => Promise<string | null>;
  escribirMeta: (clave: string, valor: string) => Promise<void>;
}

/** Subconjunto de la API remota usado por la sincronización. */
export interface ApiSync {
  listarDesde: (
    since: string | null,
  ) => Promise<{ items: LugarRemoto[]; servidor_ahora: string }>;
  guardar: (id: string, datos: DatosRemotos) => Promise<LugarRemoto>;
  borrar: (id: string) => Promise<void>;
}
