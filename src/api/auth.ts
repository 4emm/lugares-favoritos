import { ErrorApi, type ClienteApi } from "./client";
import { cadena, esObjeto, numero, respuestaInvalida } from "./validar";

export type Usuario = {
  id: string;
  email: string;
};

export type Sesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: Usuario;
};

export type SesionRenovada = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
};

function aUsuario(valor: unknown): Usuario {
  if (!esObjeto(valor)) {
    throw respuestaInvalida();
  }
  return {
    id: cadena(valor.id, "usuario.id"),
    email: cadena(valor.email, "usuario.email"),
  };
}

export function aSesion(datos: unknown): Sesion {
  if (!esObjeto(datos)) {
    throw respuestaInvalida();
  }
  return {
    token: cadena(datos.token, "token"),
    refreshToken: cadena(datos.refreshToken, "refreshToken"),
    expiraEnSeg: numero(datos.expiraEnSeg, "expiraEnSeg"),
    usuario: aUsuario(datos.usuario),
  };
}

export function aSesionRenovada(datos: unknown): SesionRenovada {
  if (!esObjeto(datos)) {
    throw respuestaInvalida();
  }
  return {
    token: cadena(datos.token, "token"),
    refreshToken: cadena(datos.refreshToken, "refreshToken"),
    expiraEnSeg: numero(datos.expiraEnSeg, "expiraEnSeg"),
  };
}

export function crearApiAuth(cliente: ClienteApi) {
  return {
    async registro(email: string, password: string): Promise<Sesion> {
      return aSesion(await cliente.post("/api/auth/registro", { email, password }));
    },
    async login(email: string, password: string): Promise<Sesion> {
      return aSesion(await cliente.post("/api/auth/login", { email, password }));
    },
    async refresh(refreshToken: string): Promise<SesionRenovada> {
      return aSesionRenovada(await cliente.post("/api/auth/refresh", { refreshToken }));
    },
    async yo(): Promise<Usuario> {
      const datos = await cliente.get("/api/auth/yo");
      if (!esObjeto(datos)) {
        throw respuestaInvalida();
      }
      return aUsuario(datos.usuario);
    },
  };
}

export { ErrorApi };
