export const colores = {
  fondo: "#0B1220",
  superficie: "#111C2E",
  superficieAlta: "#17253B",
  borde: "#24344D",
  texto: "#E8EEF9",
  textoSuave: "#93A4BD",
  primario: "#38BDF8",
  primarioOscuro: "#0284C7",
  exito: "#34D399",
  peligro: "#F87171",
  aviso: "#FBBF24",
  blanco: "#FFFFFF",
} as const;

export const espacio = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radio = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const colorCategoria: Record<string, string> = {
  cafe: "#F59E0B",
  parque: "#34D399",
  parqueadero: "#60A5FA",
  restaurante: "#F472B6",
  tienda: "#A78BFA",
  otro: "#94A3B8",
};

export const colorEstado = {
  info: "#60A5FA",
  exito: "#34D399",
  error: "#F87171",
  aviso: "#FBBF24",
} as const;
