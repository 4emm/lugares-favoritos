import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export type EstadoRumbo = {
  /** Grados desde el norte (0–360) o null si no hay brújula. */
  rumbo: number | null;
  disponible: boolean;
};

/**
 * Brújula del dispositivo con `watchHeadingAsync`. Si el sensor no existe o el
 * permiso falta, `rumbo` queda en null y el radar usa el norte fijo.
 */
export function useRumbo(activo = true): EstadoRumbo {
  const [rumbo, setRumbo] = useState<number | null>(null);
  const [disponible, setDisponible] = useState(false);
  const suscripcion = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let vigente = true;
    suscripcion.current?.remove();
    suscripcion.current = null;

    if (!activo) {
      return () => {
        vigente = false;
      };
    }

    void (async () => {
      try {
        const permiso = await Location.getForegroundPermissionsAsync();
        if (!vigente || permiso.status !== Location.PermissionStatus.GRANTED) {
          return;
        }
        setDisponible(true);
        suscripcion.current = await Location.watchHeadingAsync((lectura) => {
          const grados =
            lectura.trueHeading >= 0 ? lectura.trueHeading : lectura.magHeading;
          if (Number.isFinite(grados) && vigente) {
            setRumbo(((grados % 360) + 360) % 360);
          }
        });
      } catch {
        if (vigente) {
          setDisponible(false);
          setRumbo(null);
        }
      }
    })();

    return () => {
      vigente = false;
      suscripcion.current?.remove();
      suscripcion.current = null;
    };
  }, [activo]);

  return { rumbo, disponible: activo && disponible };
}
