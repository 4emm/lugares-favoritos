import type { LugarLocal, LugarRemoto } from "@/domain/tipos";
import type { ApiSync, RepositorioSync } from "@/services/ports";
import { CLAVE_SINCRONIZACION, crearServicioSync, datosParaApi } from "@/services/syncService";

function remoto(id: string, updated_at = "2026-01-01T00:00:00.000Z"): LugarRemoto {
  return {
    id,
    nombre: `Lugar ${id}`,
    categoria: "otro",
    lat: 1,
    lng: 2,
    altitud_m: null,
    nota: null,
    publico: false,
    foto_url: null,
    created_at: updated_at,
    updated_at,
    deleted_at: null,
  };
}

function local(parcial: Partial<LugarLocal> = {}): LugarLocal {
  return {
    id: 1,
    remote_id: "uuid-1",
    nombre: "Local",
    categoria: "cafe",
    lat: 1,
    lng: 2,
    altitud_m: 3,
    nota: "Nota",
    foto_uri: "file://foto.jpg",
    foto_url: "https://blob.test/foto.jpg",
    publico: true,
    creado_en: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted: false,
    pending: true,
    ...parcial,
  };
}

function puertos(pendientes: LugarLocal[] = [], paginas: LugarRemoto[][] = [[]]) {
  const repo: RepositorioSync = {
    pendientes: jest.fn().mockResolvedValue(pendientes),
    aplicarRemoto: jest.fn().mockResolvedValue(undefined),
    marcarSincronizado: jest.fn().mockResolvedValue(undefined),
    leerMeta: jest.fn().mockResolvedValue(null),
    escribirMeta: jest.fn().mockResolvedValue(undefined),
  };
  const api: ApiSync = {
    listarDesde: jest.fn().mockImplementation(async () => ({
      items: paginas.shift() ?? [],
      servidor_ahora: "2026-03-01T00:00:00.000Z",
    })),
    guardar: jest.fn().mockImplementation(async (id: string) =>
      remoto(id, "2026-02-01T00:00:00.000Z"),
    ),
    borrar: jest.fn().mockResolvedValue(undefined),
  };
  return { repo, api };
}

describe("sincronización", () => {
  it("transforma solo los campos remotos, sin foto_uri ni pending", () => {
    expect(datosParaApi(local())).toEqual({
      nombre: "Local",
      categoria: "cafe",
      lat: 1,
      lng: 2,
      altitud_m: 3,
      nota: "Nota",
      publico: true,
      foto_url: "https://blob.test/foto.jpg",
    });
  });

  it("sube altas y borrados antes de bajar cambios y guarda servidor_ahora", async () => {
    const borrado = local({ id: 2, remote_id: "uuid-2", deleted: true });
    const { repo, api } = puertos([local(), borrado], [[remoto("servidor")]]);
    const resultado = await crearServicioSync({ repo, api }).sincronizar();
    expect(resultado).toEqual({
      subidos: 2,
      bajados: 1,
      servidor_ahora: "2026-03-01T00:00:00.000Z",
    });
    expect(api.guardar).toHaveBeenCalledWith("uuid-1", datosParaApi(local()));
    expect(api.borrar).toHaveBeenCalledWith("uuid-2");
    expect(repo.marcarSincronizado).toHaveBeenCalledWith(
      "uuid-1",
      "2026-02-01T00:00:00.000Z",
    );
    expect(repo.marcarSincronizado).toHaveBeenCalledWith(
      "uuid-2",
      "2026-01-01T00:00:00.000Z",
    );
    expect(repo.aplicarRemoto).toHaveBeenCalledWith(remoto("servidor"));
    expect(repo.escribirMeta).toHaveBeenCalledWith(
      CLAVE_SINCRONIZACION,
      "2026-03-01T00:00:00.000Z",
    );
  });

  it("omite registros antiguos sin remote_id", async () => {
    const { repo, api } = puertos([local({ remote_id: "" })]);
    const resultado = await crearServicioSync({ repo, api }).sincronizar();
    expect(resultado.subidos).toBe(0);
    expect(api.guardar).not.toHaveBeenCalled();
  });

  it("usa since guardado y pagina de 500 en 500", async () => {
    const primera = Array.from({ length: 500 }, (_, indice) =>
      remoto(`id-${indice}`, `2026-01-01T00:00:${String(indice % 60).padStart(2, "0")}.000Z`),
    );
    const segunda = [remoto("ultimo", "2026-01-02T00:00:00.000Z")];
    const { repo, api } = puertos([], [primera, segunda]);
    (repo.leerMeta as jest.Mock).mockResolvedValue("2025-12-31T00:00:00.000Z");
    const resultado = await crearServicioSync({ repo, api }).sincronizar();
    expect(resultado.bajados).toBe(501);
    expect(api.listarDesde).toHaveBeenNthCalledWith(1, "2025-12-31T00:00:00.000Z");
    expect(api.listarDesde).toHaveBeenNthCalledWith(2, primera[499]?.updated_at);
    expect(repo.aplicarRemoto).toHaveBeenCalledTimes(501);
  });

  it("detiene la paginación si el último cursor no avanza", async () => {
    const fija = "2026-01-01T00:00:00.000Z";
    const pagina = Array.from({ length: 500 }, (_, indice) => remoto(`id-${indice}`, fija));
    const { repo, api } = puertos([], [pagina]);
    (repo.leerMeta as jest.Mock).mockResolvedValue(fija);
    await crearServicioSync({ repo, api }).sincronizar();
    expect(api.listarDesde).toHaveBeenCalledTimes(1);
  });
});
