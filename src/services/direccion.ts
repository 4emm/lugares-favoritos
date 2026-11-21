export type DatosDireccion = {
  name: string | null;
  street: string | null;
  streetNumber: string | null;
  district: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

function limpiar(valor: string | null): string | null {
  const texto = valor?.trim() ?? "";
  return texto.length > 0 ? texto : null;
}

/**
 * Arma una dirección legible sin depender del módulo nativo. Devuelve null si
 * no hay ningún dato útil (por ejemplo, en el mar).
 */
export function formatearDireccion(direccion: DatosDireccion | null): string | null {
  if (!direccion) {
    return null;
  }
  const via = [limpiar(direccion.street), limpiar(direccion.streetNumber)]
    .filter((parte): parte is string => parte !== null)
    .join(" ");
  const partes = [
    limpiar(direccion.name),
    via.length > 0 ? via : null,
    limpiar(direccion.district),
    limpiar(direccion.city),
    limpiar(direccion.region),
    limpiar(direccion.country),
  ].filter((parte): parte is string => parte !== null);
  const unicas = [...new Set(partes)];
  return unicas.length > 0 ? unicas.join(", ") : null;
}
