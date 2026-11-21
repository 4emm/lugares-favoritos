import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { repositorioLugares } from "@/repositories/lugarRepository";
import type { Coordenada } from "@/services/geo";

const CLAVE_UBICACION = "ultima_ubicacion";

export type Ubicacion = Coordenada & {
  altitud_m: number | null;
  precision_m: number | null;
  rumbo: number | null;
  actualizado_en: string | null;
};

export type PermisoUbicacion = "desconocido" | "concedido" | "denegado";

export type EstadoUbicacion = {
  ubicacion: Ubicacion | null;
  cargando: boolean;
  permiso: PermisoUbicacion;
  error: string | null;
  usandoCache: boolean;
  solicitar: () => Promise<void>;
  fijarManual: (lat: number, lng: number) => Promise<void>;
};

type UbicacionGuardada = {
  lat: number;
  lng: number;
  altitud_m: number | null;
  precision_m: number | null;
  actualizado_en: string;
};

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function leerGuardada(bruto: string | null): Ubicacion | null {
  if (!bruto) {
    return null;
  }
  try {
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== "object" || valor === null) {
      return null;
    }
    const datos = valor as Partial<UbicacionGuardada>;
    if (!esNumero(datos.lat) || !esNumero(datos.lng)) {
      return null;
    }
    return {
      lat: datos.lat,
      lng: datos.lng,
      altitud_m: esNumero(datos.altitud_m) ? datos.altitud_m : null,
      precision_m: esNumero(datos.precision_m) ? datos.precision_m : null,
      rumbo: null,
      actualizado_en: typeof datos.actualizado_en === "string" ? datos.actualizado_en : null,
    };
  } catch {
    return null;
  }
}

function desdeCoordenadas(coordenadas: Location.LocationObjectCoords): Ubicacion {
  return {
    lat: coordenadas.latitude,
    lng: coordenadas.longitude,
    altitud_m: esNumero(coordenadas.altitude) ? coordenadas.altitude : null,
    precision_m: esNumero(coordenadas.accuracy) ? coordenadas.accuracy : null,
    rumbo: esNumero(coordenadas.heading) && coordenadas.heading >= 0 ? coordenadas.heading : null,
    actualizado_en: new Date().toISOString(),
  };
}

async function guardarUbicacion(ubicacion: Ubicacion): Promise<void> {
  const datos: UbicacionGuardada = {
    lat: ubicacion.lat,
    lng: ubicacion.lng,
    altitud_m: ubicacion.altitud_m,
    precision_m: ubicacion.precision_m,
    actualizado_en: ubicacion.actualizado_en ?? new Date().toISOString(),
  };
  await repositorioLugares.escribirMeta(CLAVE_UBICACION, JSON.stringify(datos));
}

/**
 * Posición del usuario con respaldo en la última posición guardada en SQLite:
 * si el GPS está apagado, la lista y el radar siguen funcionando (criterio 3).
 */
export function useUbicacion(seguir = true): EstadoUbicacion {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [permiso, setPermiso] = useState<PermisoUbicacion>("desconocido");
  const [error, setError] = useState<string | null>(null);
  const [usandoCache, setUsandoCache] = useState(false);
  const suscripcion = useRef<Location.LocationSubscription | null>(null);
  const montado = useRef(true);

  const aplicar = useCallback((nueva: Ubicacion, cache: boolean) => {
    if (!montado.current) {
      return;
    }
    setUbicacion(nueva);
    setUsandoCache(cache);
    setError(null);
  }, []);

  const solicitar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await Location.requestForegroundPermissionsAsync();
      if (!montado.current) {
        return;
      }
      if (respuesta.status !== Location.PermissionStatus.GRANTED) {
        setPermiso("denegado");
        setError("Activa la ubicación para ordenar tus lugares por distancia.");
        return;
      }
      setPermiso("concedido");
      const actual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      aplicar(desdeCoordenadas(actual.coords), false);
      await guardarUbicacion(desdeCoordenadas(actual.coords));

      suscripcion.current?.remove();
      suscripcion.current = seguir
        ? await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10,
              timeInterval: 15_000,
            },
            (evento) => {
              const nueva = desdeCoordenadas(evento.coords);
              aplicar(nueva, false);
              void guardarUbicacion(nueva);
            },
          )
        : null;
    } catch {
      if (montado.current) {
        setError("No se pudo obtener la ubicación. Revisa el GPS e inténtalo de nuevo.");
      }
    } finally {
      if (montado.current) {
        setCargando(false);
      }
    }
  }, [aplicar, seguir]);

  useEffect(() => {
    montado.current = true;
    void (async () => {
      const guardada = leerGuardada(await repositorioLugares.leerMeta(CLAVE_UBICACION));
      if (!montado.current) {
        return;
      }
      if (guardada) {
        aplicar(guardada, true);
      }
      setCargando(false);
      await solicitar();
    })();
    return () => {
      montado.current = false;
      suscripcion.current?.remove();
      suscripcion.current = null;
    };
  }, [aplicar, solicitar]);

  const fijarManual = useCallback(
    async (lat: number, lng: number) => {
      const manual: Ubicacion = {
        lat,
        lng,
        altitud_m: null,
        precision_m: null,
        rumbo: null,
        actualizado_en: new Date().toISOString(),
      };
      aplicar(manual, true);
      await guardarUbicacion(manual);
    },
    [aplicar],
  );

  return { ubicacion, cargando, permiso, error, usandoCache, solicitar, fijarManual };
}
