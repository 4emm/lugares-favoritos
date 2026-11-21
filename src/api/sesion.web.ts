import { cadena, esObjeto, numero } from "./validar";

let sesionActual: SesionGuardada | null = null;

export type SesionGuardada = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: { id: string; email: string };
  actualizadoEn: number;
};

export function esSesionGuardada(valor: unknown): valor is SesionGuardada {
  if (!esObjeto(valor) || !esObjeto(valor.usuario)) {
    return false;
  }
  try {
    cadena(valor.token, "token");
    cadena(valor.refreshToken, "refreshToken");
    cadena(valor.usuario.id, "usuario.id");
    cadena(valor.usuario.email, "usuario.email");
    numero(valor.expiraEnSeg, "expiraEnSeg");
    numero(valor.actualizadoEn, "actualizadoEn");
    return true;
  } catch {
    return false;
  }
}

/** La vista web es solo una previsualización: no persiste tokens en el navegador. */
export async function leerSesion(): Promise<SesionGuardada | null> {
  return sesionActual;
}

export async function guardarSesion(valor: SesionGuardada): Promise<void> {
  sesionActual = valor;
}

export async function limpiarSesion(): Promise<void> {
  sesionActual = null;
}
