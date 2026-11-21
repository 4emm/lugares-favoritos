import type { LugarLocal } from "@/domain/tipos";
import { crearServicioLugares } from "@/services/lugarService";
import type { RepositorioLugares } from "@/services/ports";

function lugar(parcial: Partial<LugarLocal> = {}): LugarLocal {
  return {
    id: 1,
    remote_id: "uuid-1",
    nombre: "Parque",
    categoria: "parque",
    lat: 0,
    lng: 0,
    altitud_m: null,
    nota: null,
    foto_uri: null,
    foto_url: null,
    publico: false,
    creado_en: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted: false,
    pending: true,
    ...parcial,
  };
}

function repositorio(iniciales: LugarLocal[] = []) {
  const repo: RepositorioLugares = {
    listar: jest.fn().mockResolvedValue(iniciales),
    buscar: jest.fn().mockResolvedValue(iniciales),
    obtener: jest.fn().mockResolvedValue(iniciales[0] ?? null),
    insertar: jest.fn().mockResolvedValue(7),
    marcarBorrado: jest.fn().mockResolvedValue(undefined),
    cambiarPublico: jest.fn().mockResolvedValue(undefined),
    contarPendientes: jest.fn().mockResolvedValue(2),
  };
  return repo;
}

const ENTRADA = {
  nombre: "  Café nuevo  ",
  categoria: "cafe",
  lat: 0,
  lng: 0,
  altitud_m: 10,
  nota: "  Una nota  ",
  publico: true,
  foto_uri: "file://foto.jpg",
  foto_url: null,
};

describe("servicio de lugares", () => {
  it("delega las consultas y el contador", async () => {
    const repo = repositorio([lugar()]);
    const servicio = crearServicioLugares({ repo, generarId: () => "uuid-nuevo" });
    expect(await servicio.listar()).toHaveLength(1);
    expect(await servicio.buscar("parque")).toHaveLength(1);
    expect(await servicio.obtener(1)).toEqual(lugar());
    expect(await servicio.contarPendientes()).toBe(2);
    expect(repo.buscar).toHaveBeenCalledWith("parque");
  });

  it("ordena dos lugares a 200 m y 1 km por distancia (RF-02)", async () => {
    const cerca = lugar({ id: 1, nombre: "Cerca", lat: 0, lng: 0.0018 });
    const lejos = lugar({ id: 2, nombre: "Lejos", lat: 0, lng: 0.009 });
    const servicio = crearServicioLugares({
      repo: repositorio([lejos, cerca]),
      generarId: () => "uuid-nuevo",
    });
    const resultado = await servicio.listarCercanos({ lat: 0, lng: 0 });
    expect(resultado.map((item) => item.lugar.nombre)).toEqual(["Cerca", "Lejos"]);
    expect(resultado[0]?.distancia_m).toBeLessThan(resultado[1]?.distancia_m ?? 0);
  });

  it("guarda primero en SQLite con UUID, fecha y pending implícito", async () => {
    const repo = repositorio();
    const servicio = crearServicioLugares({
      repo,
      generarId: () => "uuid-nuevo",
      ahora: () => "2026-02-03T04:05:06.000Z",
    });
    expect(await servicio.crear(ENTRADA)).toEqual({ ok: true, id: 7 });
    expect(repo.insertar).toHaveBeenCalledWith({
      remote_id: "uuid-nuevo",
      nombre: "Café nuevo",
      categoria: "cafe",
      lat: 0,
      lng: 0,
      altitud_m: 10,
      nota: "Una nota",
      foto_uri: "file://foto.jpg",
      foto_url: null,
      publico: true,
      updated_at: "2026-02-03T04:05:06.000Z",
    });
  });

  it("no consulta el repositorio si la entrada es inválida", async () => {
    const repo = repositorio();
    const servicio = crearServicioLugares({ repo, generarId: () => "uuid-nuevo" });
    const resultado = await servicio.crear({ ...ENTRADA, nombre: "" });
    expect(resultado.ok).toBe(false);
    expect(repo.listar).not.toHaveBeenCalled();
    expect(repo.insertar).not.toHaveBeenCalled();
  });

  it("rechaza un duplicado a menos de 15 m", async () => {
    const repo = repositorio([lugar({ nombre: "Café nuevo", lat: 0, lng: 0 })]);
    const servicio = crearServicioLugares({ repo, generarId: () => "uuid-nuevo" });
    const resultado = await servicio.crear(ENTRADA);
    expect(resultado).toEqual({
      ok: false,
      errores: [
        { campo: "nombre", mensaje: "Ya existe «Café nuevo» a menos de 15 m de este punto" },
      ],
    });
    expect(repo.insertar).not.toHaveBeenCalled();
  });

  it("marca borrado y visibilidad como pendientes", async () => {
    const repo = repositorio();
    const servicio = crearServicioLugares({
      repo,
      generarId: () => "uuid-nuevo",
      ahora: () => "2026-02-03T04:05:06.000Z",
    });
    await servicio.eliminar(3);
    await servicio.cambiarPublico(3, true);
    expect(repo.marcarBorrado).toHaveBeenCalledWith(3, "2026-02-03T04:05:06.000Z");
    expect(repo.cambiarPublico).toHaveBeenCalledWith(3, true, "2026-02-03T04:05:06.000Z");
  });
});
