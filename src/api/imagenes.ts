import type { ClienteApi } from "./client";
import { cadena, esObjeto, respuestaInvalida } from "./validar";

export type ImagenSubida = {
  url: string;
  pathname: string;
};

export function crearApiImagenes(cliente: ClienteApi) {
  return {
    async subir(cuerpo: ArrayBuffer, contentType: string): Promise<ImagenSubida> {
      const datos = await cliente.solicitar("/api/imagenes", {
        method: "POST",
        cuerpo,
        contentType,
      });
      if (!esObjeto(datos)) {
        throw respuestaInvalida();
      }
      return {
        url: cadena(datos.url, "url"),
        pathname: cadena(datos.pathname, "pathname"),
      };
    },
    async borrar(url: string): Promise<void> {
      await cliente.delete(`/api/imagenes?url=${encodeURIComponent(url)}`);
    },
  };
}
