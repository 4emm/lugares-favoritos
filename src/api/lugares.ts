import type { LugarRemoto } from "@/domain/tipos";

import { ErrorApi, type ClienteApi } from "./client";
import {
  arreglo,
  booleano,
  cadena,
  cadenaONull,
  cadenaOpcional,
  esObjeto,
  numero,
  numeroONull,
  respuestaInvalida,
} from "./validar";

export type ListadoLugares = {
  items: LugarRemoto[];
  servidor_ahora: string;
};

/** Normaliza y valida un documento remoto; los campos opcionales usan defectos. */
export function aLugarRemoto(valor: unknown): LugarRemoto {
  if (!esObjeto(valor)) {
    throw respuestaInvalida();
  }
  return {
    id: cadena(valor.id, "id"),
    nombre: cadena(valor.nombre, "nombre"),
    categoria: cadenaOpcional(valor.categoria, "otro"),
    lat: numero(valor.lat, "lat"),
    lng: numero(valor.lng, "lng"),
    altitud_m: numeroONull(valor.altitud_m),
    nota: cadenaONull(valor.nota),
    publico: booleano(valor.publico, false),
    foto_url: cadenaONull(valor.foto_url),
    created_at: cadenaOpcional(valor.created_at, ""),
    updated_at: cadena(valor.updated_at, "updated_at"),
    deleted_at: cadenaONull(valor.deleted_at),
  };
}

export function aListado(valor: unknown): ListadoLugares {
  if (!esObjeto(valor)) {
    throw respuestaInvalida();
  }
  return {
    items: arreglo(valor.items).map(aLugarRemoto),
    servidor_ahora: cadena(valor.servidor_ahora, "servidor_ahora"),
  };
}

export function crearApiLugares(cliente: ClienteApi) {
  return {
    async listarDesde(since: string | null): Promise<ListadoLugares> {
      const consulta = since ? `?since=${encodeURIComponent(since)}` : "";
      return aListado(await cliente.get(`/api/lugares${consulta}`));
    },
    async guardar(id: string, datos: unknown): Promise<LugarRemoto> {
      return aLugarRemoto(await cliente.put(`/api/lugares/${encodeURIComponent(id)}`, datos));
    },
    async borrar(id: string): Promise<void> {
      await cliente.delete(`/api/lugares/${encodeURIComponent(id)}`);
    },
    async cerca(lat: number, lng: number, radioM: number): Promise<LugarRemoto[]> {
      const consulta = `?lat=${lat}&lng=${lng}&radio_m=${Math.round(radioM)}`;
      const datos = await cliente.get(`/api/lugares/cerca${consulta}`);
      if (!esObjeto(datos)) {
        throw new ErrorApi(500, "Respuesta inesperada de /api/lugares/cerca");
      }
      return arreglo(datos.items).map(aLugarRemoto);
    },
    async publicos(): Promise<LugarRemoto[]> {
      const datos = await cliente.get("/api/lugares/publicos");
      if (!esObjeto(datos)) {
        throw new ErrorApi(500, "Respuesta inesperada de /api/lugares/publicos");
      }
      return arreglo(datos.items).map(aLugarRemoto);
    },
  };
}
