import { useCallback, useEffect, useRef, useState } from "react";

import type { LugarLocal } from "@/domain/tipos";
import { mensajeDeError } from "@/api/client";
import { servicioLugares } from "@/services/contenedor";

export type EstadoLugares = {
  lugares: LugarLocal[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
};

/** Lee los lugares de SQLite y recarga al volver a la pantalla. */
export function useLugares(): EstadoLugares {
  const [lugares, setLugares] = useState<LugarLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const montado = useRef(true);

  const recargar = useCallback(async () => {
    try {
      const datos = await servicioLugares.listar();
      if (montado.current) {
        setLugares(datos);
        setError(null);
      }
    } catch (fallo) {
      if (montado.current) {
        setError(mensajeDeError(fallo));
      }
    } finally {
      if (montado.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    void Promise.resolve().then(recargar);
    return () => {
      montado.current = false;
    };
  }, [recargar]);

  return { lugares, cargando, error, recargar };
}
