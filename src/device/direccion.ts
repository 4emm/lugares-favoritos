import * as Location from "expo-location";

import { formatearDireccion } from "@/services/direccion";

/** Geocodificación inversa tolerante a fallos: nunca rompe la pantalla. */
export async function geocodificarInversa(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const resultados = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return formatearDireccion(resultados[0] ?? null);
  } catch {
    return null;
  }
}
