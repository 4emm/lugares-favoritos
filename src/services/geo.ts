export type Coordenada = {
  lat: number;
  lng: number;
};

export type PuntoRadar = {
  x: number;
  y: number;
  distancia: number;
  dentro: boolean;
};

const RADIO_TIERRA_M = 6_371_008.8;

export function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

export function normalizarGrados(grados: number): number {
  return ((grados % 360) + 360) % 360;
}

/** Distancia haversine en metros entre dos coordenadas. */
export function distanciaMetros(origen: Coordenada, destino: Coordenada): number {
  const dLat = aRadianes(destino.lat - origen.lat);
  const dLng = aRadianes(destino.lng - origen.lng);
  const lat1 = aRadianes(origen.lat);
  const lat2 = aRadianes(destino.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rumbo inicial (0–360°, 0 = norte) desde el origen hacia el destino. */
export function rumboGrados(origen: Coordenada, destino: Coordenada): number {
  const lat1 = aRadianes(origen.lat);
  const lat2 = aRadianes(destino.lat);
  const dLng = aRadianes(destino.lng - origen.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return normalizarGrados((Math.atan2(y, x) * 180) / Math.PI);
}

/**
 * Convierte un lugar a coordenadas del radar en el rango [-1, 1], con el eje Y
 * hacia arriba (SVG invierte el signo al dibujar). `rotacionGrados` permite
 * orientar el radar según la brújula o una rotación manual.
 */
export function puntoEnRadar(
  centro: Coordenada,
  destino: Coordenada,
  radioMetros: number,
  rotacionGrados = 0,
): PuntoRadar {
  const distancia = distanciaMetros(centro, destino);
  const rumbo = normalizarGrados(rumboGrados(centro, destino) - rotacionGrados);
  const proporcion = Math.min(distancia / Math.max(radioMetros, 1), 1);
  const angulo = aRadianes(rumbo);
  return {
    x: Math.sin(angulo) * proporcion,
    y: -Math.cos(angulo) * proporcion,
    distancia,
    dentro: distancia <= radioMetros,
  };
}

/** Formatea una distancia para mostrarla en la interfaz. */
export function formatearDistancia(metros: number): string {
  if (!Number.isFinite(metros) || metros < 0) {
    return "—";
  }
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }
  return `${(metros / 1000).toFixed(metros < 10_000 ? 1 : 0).replace(".", ",")} km`;
}
