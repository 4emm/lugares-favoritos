import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

const UMBRAL = 1.6;
const ESPERA_MS = 1200;

export type EstadoSacudida = {
  disponible: boolean;
};

/**
 * Detecta una sacudida con el acelerómetro para recentrar el radar. Siempre
 * existe la alternativa del botón «Centrar» si el sensor no está disponible.
 */
export function useSacudida(onSacudida: () => void, activo = true): EstadoSacudida {
  const [disponible, setDisponible] = useState(false);
  const callback = useRef(onSacudida);
  const ultima = useRef(0);

  useEffect(() => {
    callback.current = onSacudida;
  }, [onSacudida]);

  useEffect(() => {
    let vigente = true;
    let suscripcion: { remove: () => void } | null = null;

    if (!activo) {
      return () => {
        vigente = false;
      };
    }

    void (async () => {
      try {
        const hay = await Accelerometer.isAvailableAsync();
        if (!vigente || !hay) {
          return;
        }
        setDisponible(true);
        Accelerometer.setUpdateInterval(120);
        suscripcion = Accelerometer.addListener(({ x, y, z }) => {
          const magnitud = Math.sqrt(x * x + y * y + z * z);
          const ahora = Date.now();
          if (Math.abs(magnitud - 1) > UMBRAL && ahora - ultima.current > ESPERA_MS) {
            ultima.current = ahora;
            callback.current();
          }
        });
      } catch {
        if (vigente) {
          setDisponible(false);
        }
      }
    })();

    return () => {
      vigente = false;
      suscripcion?.remove();
      suscripcion = null;
    };
  }, [activo]);

  return { disponible: activo && disponible };
}
