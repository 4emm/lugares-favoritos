import * as SecureStore from "expo-secure-store";

import { cadena, esObjeto, numero } from "./validar";

const CLAVE = "sesion_lugares_v1";

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

/** Los tokens viven en expo-secure-store, nunca en AsyncStorage. */
export async function leerSesion(): Promise<SesionGuardada | null> {
  const bruto = await SecureStore.getItemAsync(CLAVE);
  if (!bruto) {
    return null;
  }
  try {
    const valor: unknown = JSON.parse(bruto);
    return esSesionGuardada(valor) ? valor : null;
  } catch {
    return null;
  }
}

export async function guardarSesion(sesion: SesionGuardada): Promise<void> {
  await SecureStore.setItemAsync(CLAVE, JSON.stringify(sesion));
}

export async function limpiarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE);
}
