export type LugarLocal = {
  id: number;
  remote_id: string;
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  foto_uri: string | null;
  foto_url: string | null;
  publico: boolean;
  creado_en: string;
  updated_at: string;
  deleted: boolean;
  pending: boolean;
};

export type LugarNuevo = {
  remote_id: string;
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  foto_uri: string | null;
  foto_url: string | null;
  publico: boolean;
  updated_at: string;
};

export type LugarRemoto = {
  id: string;
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  publico: boolean;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DatosRemotos = {
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  altitud_m: number | null;
  nota: string | null;
  publico: boolean;
  foto_url: string | null;
};
