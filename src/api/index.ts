import { crearApiAuth } from "./auth";
import { crearClienteApi } from "./client";
import { crearApiImagenes } from "./imagenes";
import { crearApiLugares } from "./lugares";
import { guardarSesion, leerSesion, limpiarSesion } from "./sesion";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/** Cliente sin token: solo para registro, login y refresh. */
const clientePublico = crearClienteApi({ baseUrl: BASE_URL });

export const apiAuth = crearApiAuth(clientePublico);

/**
 * Cliente autenticado: adjunta el ID token y, ante un 401, refresca una sola vez
 * y reintenta la petición original. Si el refresh falla, borra la sesión.
 */
export const clienteAutenticado = crearClienteApi({
  baseUrl: BASE_URL,
  obtenerToken: async () => (await leerSesion())?.token ?? null,
  refrescarToken: async () => {
    const sesion = await leerSesion();
    if (!sesion) {
      return null;
    }
    try {
      const renovada = await apiAuth.refresh(sesion.refreshToken);
      await guardarSesion({
        ...sesion,
        token: renovada.token,
        refreshToken: renovada.refreshToken,
        expiraEnSeg: renovada.expiraEnSeg,
        actualizadoEn: Date.now(),
      });
      return renovada.token;
    } catch {
      await limpiarSesion();
      return null;
    }
  },
});

export const apiLugares = crearApiLugares(clienteAutenticado);
export const apiImagenes = crearApiImagenes(clienteAutenticado);
