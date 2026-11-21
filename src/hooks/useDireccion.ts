import { useEffect, useState } from "react";

import { geocodificarInversa } from "@/device/direccion";

/** Dirección aproximada de una coordenada; null mientras carga o si falla. */
export function useDireccion(lat: number | null, lng: number | null): string | null {
  const [resultado, setResultado] = useState<{
    clave: string;
    texto: string | null;
  } | null>(null);
  const clave = lat === null || lng === null ? null : `${lat},${lng}`;

  useEffect(() => {
    if (clave === null || lat === null || lng === null) {
      return;
    }
    let vigente = true;
    void geocodificarInversa(lat, lng).then((texto) => {
      if (vigente) {
        setResultado({ clave, texto });
      }
    });
    return () => {
      vigente = false;
    };
  }, [clave, lat, lng]);

  return resultado?.clave === clave ? resultado.texto : null;
}
