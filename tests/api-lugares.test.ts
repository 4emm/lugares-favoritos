import type { ClienteApi } from "@/api/client";
import { aListado, aLugarRemoto, crearApiLugares } from "@/api/lugares";

const DATOS = {
  id: "uuid-1",
  nombre: "Parque",
  categoria: "parque",
  lat: 4.7,
  lng: -74.07,
  altitud_m: 2600,
  nota: "Nota",
  publico: true,
  foto_url: "https://blob.test/foto.jpg",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  deleted_at: null,
};

function cliente(respuesta: unknown = { items: [DATOS], servidor_ahora: "2026-01-03T00:00:00.000Z" }) {
  const mock: ClienteApi = {
    solicitar: jest.fn().mockResolvedValue(respuesta),
    get: jest.fn().mockResolvedValue(respuesta),
    post: jest.fn().mockResolvedValue(respuesta),
    put: jest.fn().mockResolvedValue(DATOS),
    delete: jest.fn().mockResolvedValue({ ok: true }),
  };
  return mock;
}

describe("API de lugares", () => {
  it("valida un documento remoto y aplica defectos", () => {
    expect(aLugarRemoto(DATOS)).toEqual(DATOS);
    expect(aLugarRemoto({ id: "id", nombre: "Casa", lat: 1, lng: 2, updated_at: "fecha" })).toEqual({
      id: "id",
      nombre: "Casa",
      categoria: "otro",
      lat: 1,
      lng: 2,
      altitud_m: null,
      nota: null,
      publico: false,
      foto_url: null,
      created_at: "",
      updated_at: "fecha",
      deleted_at: null,
    });
    expect(() => aLugarRemoto(null)).toThrow("La API devolvió una respuesta inesperada");
    expect(() => aLugarRemoto({ ...DATOS, lat: "4.7" })).toThrow();
    expect(() => aListado([])).toThrow();
  });

  it("lista con y sin cursor", async () => {
    const http = cliente();
    const api = crearApiLugares(http);
    expect((await api.listarDesde(null)).items).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith("/api/lugares");
    await api.listarDesde("2026-01-01T00:00:00.000Z");
    expect(http.get).toHaveBeenLastCalledWith(
      `/api/lugares?since=${encodeURIComponent("2026-01-01T00:00:00.000Z")}`,
    );
  });

  it("guarda y borra por UUID codificado", async () => {
    const http = cliente();
    const api = crearApiLugares(http);
    expect((await api.guardar("uuid/1", { nombre: "Casa" })).id).toBe("uuid-1");
    expect(http.put).toHaveBeenCalledWith("/api/lugares/uuid%2F1", { nombre: "Casa" });
    await api.borrar("uuid/1");
    expect(http.delete).toHaveBeenCalledWith("/api/lugares/uuid%2F1");
  });

  it("consulta cercanos y públicos", async () => {
    const http = cliente({ items: [DATOS] });
    const api = crearApiLugares(http);
    expect(await api.cerca(4.7, -74.07, 1000.4)).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith(
      "/api/lugares/cerca?lat=4.7&lng=-74.07&radio_m=1000",
    );
    expect(await api.publicos()).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith("/api/lugares/publicos");
  });

  it("rechaza respuestas inesperadas de los listados", async () => {
    const api = crearApiLugares(cliente(null));
    await expect(api.cerca(1, 2, 100)).rejects.toThrow("Respuesta inesperada");
    await expect(api.publicos()).rejects.toThrow("Respuesta inesperada");
  });
});
