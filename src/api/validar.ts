import { ErrorApi } from "./client";

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export function respuestaInvalida(): ErrorApi {
  return new ErrorApi(500, "La API devolvió una respuesta inesperada");
}

export function cadena(valor: unknown, campo: string): string {
  if (typeof valor !== "string" || valor.length === 0) {
    throw new ErrorApi(500, `Falta el campo ${campo} en la respuesta`);
  }
  return valor;
}

export function cadenaOpcional(valor: unknown, defecto: string): string {
  return typeof valor === "string" ? valor : defecto;
}

export function cadenaONull(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

export function numero(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ErrorApi(500, `El campo ${campo} no es un número válido`);
  }
  return valor;
}

export function numeroONull(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

export function booleano(valor: unknown, defecto: boolean): boolean {
  return typeof valor === "boolean" ? valor : defecto;
}

export function arreglo(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

export function leerMensajeError(datos: unknown): string | null {
  if (!esObjeto(datos)) {
    return null;
  }
  return typeof datos.error === "string" && datos.error.length > 0 ? datos.error : null;
}

export function leerDetalles(datos: unknown): { campo: string; mensaje: string }[] {
  if (!esObjeto(datos) || !Array.isArray(datos.detalles)) {
    return [];
  }
  return datos.detalles.flatMap((detalle) => {
    if (!esObjeto(detalle) || typeof detalle.campo !== "string") {
      return [];
    }
    return [
      {
        campo: detalle.campo,
        mensaje: typeof detalle.mensaje === "string" ? detalle.mensaje : "Valor inválido",
      },
    ];
  });
}
