import type { LugarLocal } from "@/domain/tipos";
import type { Coordenada } from "@/services/geo";
import { distanciaMetros } from "@/services/geo";
import {
  buscarDuplicado,
  validarLugar,
  type EntradaLugar,
  type ErrorCampo,
} from "@/services/validacion";

import type { RepositorioLugares } from "./ports";

export type EntradaCreacion = EntradaLugar & {
  foto_uri: string | null;
  foto_url: string | null;
};

export type LugarConDistancia = {
  lugar: LugarLocal;
  distancia_m: number;
};

export type ResultadoCreacion =
  | { ok: true; id: number }
  | { ok: false; errores: ErrorCampo[] };

export type OpcionesServicioLugares = {
  repo: RepositorioLugares;
  generarId: () => string;
  ahora?: () => string;
};

export function crearServicioLugares({
  repo,
  generarId,
  ahora = () => new Date().toISOString(),
}: OpcionesServicioLugares) {
  return {
    listar: (): Promise<LugarLocal[]> => repo.listar(),
    buscar: (texto: string): Promise<LugarLocal[]> => repo.buscar(texto),
    obtener: (id: number): Promise<LugarLocal | null> => repo.obtener(id),
    contarPendientes: (): Promise<number> => repo.contarPendientes(),

    /** Lista ordenada por distancia a la posición actual (RF-02). */
    async listarCercanos(origen: Coordenada): Promise<LugarConDistancia[]> {
      const lugares = await repo.listar();
      return lugares
        .map((lugar) => ({ lugar, distancia_m: distanciaMetros(origen, lugar) }))
        .sort((a, b) => a.distancia_m - b.distancia_m);
    },

    async crear(entrada: EntradaCreacion): Promise<ResultadoCreacion> {
      const errores = validarLugar(entrada);
      if (errores.length > 0) {
        return { ok: false, errores };
      }
      const existentes = await repo.listar();
      const duplicado = buscarDuplicado(entrada, existentes);
      if (duplicado) {
        return {
          ok: false,
          errores: [
            {
              campo: "nombre",
              mensaje: `Ya existe «${duplicado.nombre}» a menos de 15 m de este punto`,
            },
          ],
        };
      }
      const timestamp = ahora();
      const id = await repo.insertar({
        remote_id: generarId(),
        nombre: entrada.nombre.trim(),
        categoria: entrada.categoria,
        lat: entrada.lat,
        lng: entrada.lng,
        altitud_m: entrada.altitud_m,
        nota: entrada.nota?.trim() || null,
        foto_uri: entrada.foto_uri,
        foto_url: entrada.foto_url,
        publico: entrada.publico,
        updated_at: timestamp,
      });
      return { ok: true, id };
    },

    /** Borrado lógico local: la sincronización lo propaga como DELETE. */
    eliminar: (id: number): Promise<void> => repo.marcarBorrado(id, ahora()),

    cambiarPublico: (id: number, publico: boolean): Promise<void> =>
      repo.cambiarPublico(id, publico, ahora()),
  };
}
