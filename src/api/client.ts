import { leerDetalles, leerMensajeError } from "./validar";

export type DetalleError = {
  campo: string;
  mensaje: string;
};

/** Error de la API con el código HTTP y los detalles de validación. */
export class ErrorApi extends Error {
  readonly status: number;
  readonly detalles: DetalleError[];

  constructor(status: number, mensaje: string, detalles: DetalleError[] = []) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.detalles = detalles;
  }
}

export type OpcionesSolicitud = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
  cuerpo?: BodyInit;
  contentType?: string;
};

export type ClienteApi = {
  solicitar: (ruta: string, opciones?: OpcionesSolicitud) => Promise<unknown>;
  get: (ruta: string) => Promise<unknown>;
  post: (ruta: string, json?: unknown) => Promise<unknown>;
  put: (ruta: string, json?: unknown) => Promise<unknown>;
  delete: (ruta: string) => Promise<unknown>;
};

export type ConfiguracionCliente = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  obtenerToken?: () => Promise<string | null>;
  refrescarToken?: () => Promise<string | null>;
};

async function errorDeRespuesta(respuesta: Response): Promise<ErrorApi> {
  const datos: unknown = await respuesta.json().catch(() => null);
  const mensaje = leerMensajeError(datos) ?? `Error ${respuesta.status}`;
  return new ErrorApi(respuesta.status, mensaje, leerDetalles(datos));
}

async function ejecutarFetch(
  fetchImpl: typeof fetch,
  url: string,
  opciones: RequestInit,
): Promise<Response> {
  try {
    return await fetchImpl(url, opciones);
  } catch {
    throw new ErrorApi(0, "No se pudo conectar con la API");
  }
}

function construirCuerpo(opciones: OpcionesSolicitud): BodyInit | undefined {
  if (opciones.cuerpo !== undefined) {
    return opciones.cuerpo;
  }
  return opciones.json === undefined ? undefined : JSON.stringify(opciones.json);
}

function construirCabeceras(token: string | null, opciones: OpcionesSolicitud): Headers {
  const cabeceras = new Headers();
  if (opciones.json !== undefined) {
    cabeceras.set("content-type", "application/json");
  }
  if (opciones.contentType) {
    cabeceras.set("content-type", opciones.contentType);
  }
  if (token) {
    cabeceras.set("authorization", `Bearer ${token}`);
  }
  return cabeceras;
}

/**
 * Cliente HTTP sin dependencias de React Native: recibe `fetch` y las funciones
 * de token/refresh, lo que permite probarlo con dobles en Jest.
 */
export function crearClienteApi(config: ConfiguracionCliente): ClienteApi {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const hacerFetch = config.fetchImpl ?? fetch;

  async function solicitar(
    ruta: string,
    opciones: OpcionesSolicitud = {},
    reintentar = true,
  ): Promise<unknown> {
    if (baseUrl.length === 0) {
      throw new ErrorApi(0, "Falta configurar EXPO_PUBLIC_API_URL");
    }
    const token = (await config.obtenerToken?.()) ?? null;
    const respuesta = await ejecutarFetch(
      hacerFetch,
      `${baseUrl}${ruta.startsWith("/") ? ruta : `/${ruta}`}`,
      {
        method: opciones.method ?? "GET",
        headers: construirCabeceras(token, opciones),
        body: construirCuerpo(opciones),
      },
    );

    if (respuesta.status === 401 && reintentar && config.refrescarToken) {
      const nuevoToken = await config.refrescarToken();
      if (!nuevoToken) {
        throw new ErrorApi(401, "La sesión expiró. Vuelve a iniciar sesión.");
      }
      return solicitar(ruta, opciones, false);
    }
    if (!respuesta.ok) {
      throw await errorDeRespuesta(respuesta);
    }
    if (respuesta.status === 204) {
      return null;
    }
    return await respuesta.json().catch(() => null);
  }

  return {
    solicitar,
    get: (ruta) => solicitar(ruta),
    post: (ruta, json) => solicitar(ruta, { method: "POST", json }),
    put: (ruta, json) => solicitar(ruta, { method: "PUT", json }),
    delete: (ruta) => solicitar(ruta, { method: "DELETE" }),
  };
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Ocurrió un error inesperado";
}
