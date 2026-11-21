import * as Crypto from "expo-crypto";

import { apiLugares } from "@/api";
import { repositorioLugares } from "@/repositories/lugarRepository";

import { crearServicioLugares } from "./lugarService";
import { crearServicioSync } from "./syncService";

/** Instancias reales: base SQLite + cliente HTTP con la sesión del usuario. */
export const servicioLugares = crearServicioLugares({
  repo: repositorioLugares,
  generarId: () => Crypto.randomUUID(),
});

export const servicioSync = crearServicioSync({
  repo: repositorioLugares,
  api: apiLugares,
});
