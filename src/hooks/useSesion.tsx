import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { apiAuth } from "@/api";
import { ErrorApi } from "@/api/client";
import { guardarSesion, leerSesion, limpiarSesion } from "@/api/sesion";

export type UsuarioSesion = {
  id: string;
  email: string;
};

export type EstadoSesion = {
  cargando: boolean;
  usuario: UsuarioSesion | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const CONTEXTO = createContext<EstadoSesion | null>(null);

/**
 * Sesión persistida en expo-secure-store. Si hay red se valida el token contra
 * `/api/auth/yo`; sin red se conserva la sesión local para seguir usando la app.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    void (async () => {
      const sesion = await leerSesion();
      if (!montado.current) {
        return;
      }
      if (!sesion) {
        setCargando(false);
        return;
      }
      setUsuario(sesion.usuario);
      setCargando(false);
      try {
        const remoto = await apiAuth.yo();
        if (montado.current) {
          setUsuario(remoto);
        }
      } catch (error) {
        if (error instanceof ErrorApi && error.status === 401) {
          await limpiarSesion();
          if (montado.current) {
            setUsuario(null);
          }
        }
      }
    })();
    return () => {
      montado.current = false;
    };
  }, []);

  const guardar = useCallback(async (email: string, password: string, registro: boolean) => {
    const sesion = registro
      ? await apiAuth.registro(email, password)
      : await apiAuth.login(email, password);
    await guardarSesion({ ...sesion, actualizadoEn: Date.now() });
    setUsuario(sesion.usuario);
  }, []);

  const iniciarSesion = useCallback(
    (email: string, password: string) => guardar(email, password, false),
    [guardar],
  );

  const registrarse = useCallback(
    (email: string, password: string) => guardar(email, password, true),
    [guardar],
  );

  const cerrarSesion = useCallback(async () => {
    await limpiarSesion();
    setUsuario(null);
  }, []);

  return (
    <CONTEXTO.Provider value={{ cargando, usuario, iniciarSesion, registrarse, cerrarSesion }}>
      {children}
    </CONTEXTO.Provider>
  );
}

export function useSesion(): EstadoSesion {
  const estado = useContext(CONTEXTO);
  if (!estado) {
    throw new Error("useSesion debe usarse dentro de SesionProvider");
  }
  return estado;
}
