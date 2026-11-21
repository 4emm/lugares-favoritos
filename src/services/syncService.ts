import type { DatosRemotos, LugarLocal, LugarRemoto } from "@/domain/tipos";

import type { ApiSync, RepositorioSync } from "./ports";

export const CLAVE_SINCRONIZACION = "ultima_sincronizacion";
export const TAMANO_PAGINA = 500;
const MAX_PAGINAS = 100;

export type ResultadoSync = {
  subidos: number;
  bajados: number;
  servidor_ahora: string;
};

export function datosParaApi(lugar: LugarLocal): DatosRemotos {
  return {
    nombre: lugar.nombre,
    categoria: lugar.categoria,
    lat: lugar.lat,
    lng: lugar.lng,
    altitud_m: lugar.altitud_m,
    nota: lugar.nota,
    publico: lugar.publico,
    foto_url: lugar.foto_url,
  };
}

export type OpcionesSync = {
  repo: RepositorioSync;
  api: ApiSync;
};

/**
 * Estrategia: subir pendientes (PUT/DELETE) y después pedir `?since=` en
 * páginas de 500 hasta recibir una página incompleta. El conflicto lo resuelve
 * el repositorio con la última escritura (`updated_at`).
 */
export function crearServicioSync({ repo, api }: OpcionesSync) {
  async function subirPendientes(): Promise<number> {
    const pendientes = await repo.pendientes();
    let subidos = 0;
    for (const lugar of pendientes) {
      if (lugar.remote_id.length === 0) {
        continue;
      }
      if (lugar.deleted) {
        await api.borrar(lugar.remote_id);
        await repo.marcarSincronizado(lugar.remote_id, lugar.updated_at);
      } else {
        const remoto = await api.guardar(lugar.remote_id, datosParaApi(lugar));
        await repo.marcarSincronizado(lugar.remote_id, remoto.updated_at);
      }
      subidos += 1;
    }
    return subidos;
  }

  async function bajarCambios(): Promise<{ bajados: number; servidorAhora: string }> {
    let since = await repo.leerMeta(CLAVE_SINCRONIZACION);
    let servidorAhora = since ?? new Date().toISOString();
    let bajados = 0;

    for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
      const respuesta = await api.listarDesde(since);
      servidorAhora = respuesta.servidor_ahora;
      for (const item of respuesta.items) {
        await repo.aplicarRemoto(item);
      }
      bajados += respuesta.items.length;
      const ultimo = respuesta.items[respuesta.items.length - 1];
      if (respuesta.items.length < TAMANO_PAGINA || !ultimo || ultimo.updated_at === since) {
        break;
      }
      since = ultimo.updated_at;
    }
    return { bajados, servidorAhora };
  }

  return {
    async sincronizar(): Promise<ResultadoSync> {
      const subidos = await subirPendientes();
      const { bajados, servidorAhora } = await bajarCambios();
      await repo.escribirMeta(CLAVE_SINCRONIZACION, servidorAhora);
      return { subidos, bajados, servidor_ahora: servidorAhora };
    },
  };
}

export type { LugarRemoto };
