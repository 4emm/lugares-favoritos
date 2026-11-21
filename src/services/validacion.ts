import { distanciaMetros } from "@/services/geo";

export const CATEGORIAS = [
  "cafe",
  "parque",
  "parqueadero",
  "restaurante",
  "tienda",
  "otro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const ETIQUETAS_CATEGORIA: Record<Categoria, string> = {
  cafe: "Café",
  parque: "Parque",
  parqueadero: "Parqueadero",
  restaurante: "Restaurante",
  tienda: "Tienda",
  otro: "Otro",
};

export type ErrorCampo = {
  campo: string;
  mensaje: string;
};

export type EntradaLugar = {
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  publico: boolean;
};

export type LugarComparable = {
  nombre: string;
  lat: number;
  lng: number;
};

export const DISTANCIA_MINIMA_M = 15;
export const PRECISION_MAXIMA_M = 50;

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor);
}

export function normalizarCategoria(valor: string): Categoria {
  return esCategoria(valor) ? valor : "otro";
}

export function validarCoordenadas(lat: number, lng: number): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errores.push({ campo: "lat", mensaje: "La latitud debe estar entre -90 y 90" });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    errores.push({ campo: "lng", mensaje: "La longitud debe estar entre -180 y 180" });
  }
  return errores;
}

export function validarLugar(datos: EntradaLugar): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  if (datos.nombre.trim().length === 0) {
    errores.push({ campo: "nombre", mensaje: "El nombre es obligatorio" });
  } else if (datos.nombre.trim().length > 120) {
    errores.push({ campo: "nombre", mensaje: "El nombre no puede superar 120 caracteres" });
  }
  if (datos.nota !== null && datos.nota.length > 1000) {
    errores.push({ campo: "nota", mensaje: "La nota no puede superar 1000 caracteres" });
  }
  if (datos.altitud_m !== null && !Number.isFinite(datos.altitud_m)) {
    errores.push({ campo: "altitud_m", mensaje: "La altitud no es válida" });
  }
  return [...errores, ...validarCoordenadas(datos.lat, datos.lng)];
}

/**
 * Regla del proyecto: no guardar dos lugares a menos de 15 m con el mismo
 * nombre. Devuelve el lugar que provoca el conflicto o null.
 */
export function buscarDuplicado(
  candidato: LugarComparable,
  existentes: readonly LugarComparable[],
  minimoMetros = DISTANCIA_MINIMA_M,
): LugarComparable | null {
  const nombre = candidato.nombre.trim().toLowerCase();
  if (nombre.length === 0) {
    return null;
  }
  return (
    existentes.find(
      (lugar) =>
        lugar.nombre.trim().toLowerCase() === nombre &&
        distanciaMetros(candidato, lugar) < minimoMetros,
    ) ?? null
  );
}

export function precisionBaja(precisionMetros: number | null): boolean {
  return precisionMetros !== null && precisionMetros > PRECISION_MAXIMA_M;
}
