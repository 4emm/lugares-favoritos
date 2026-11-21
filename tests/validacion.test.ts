import {
  buscarDuplicado,
  esCategoria,
  normalizarCategoria,
  precisionBaja,
  validarCoordenadas,
  validarLugar,
  type EntradaLugar,
} from "@/services/validacion";

const VALIDO: EntradaLugar = {
  nombre: "Parque",
  categoria: "parque",
  lat: 4.7,
  lng: -74.07,
  altitud_m: 2600,
  nota: null,
  publico: false,
};

describe("validación de lugares", () => {
  it("acepta datos válidos", () => {
    expect(validarLugar(VALIDO)).toEqual([]);
    expect(validarLugar({ ...VALIDO, nombre: "  Nombre con espacios  " })).toEqual([]);
  });

  it("rechaza nombre vacío o demasiado largo", () => {
    expect(validarLugar({ ...VALIDO, nombre: "   " })[0]?.campo).toBe("nombre");
    expect(validarLugar({ ...VALIDO, nombre: "a".repeat(121) })[0]?.campo).toBe("nombre");
  });

  it("rechaza notas largas y altitudes inválidas", () => {
    expect(validarLugar({ ...VALIDO, nota: "a".repeat(1001) })[0]?.campo).toBe("nota");
    expect(validarLugar({ ...VALIDO, altitud_m: Number.NaN })[0]?.campo).toBe("altitud_m");
  });

  it("valida los rangos de coordenadas", () => {
    expect(validarCoordenadas(-90, 180)).toEqual([]);
    expect(validarCoordenadas(91, -181).map((error) => error.campo)).toEqual(["lat", "lng"]);
    expect(validarCoordenadas(Number.NaN, Number.POSITIVE_INFINITY)).toHaveLength(2);
  });

  it("normaliza las categorías", () => {
    expect(esCategoria("cafe")).toBe(true);
    expect(esCategoria("inventada")).toBe(false);
    expect(normalizarCategoria("cafe")).toBe("cafe");
    expect(normalizarCategoria("inventada")).toBe("otro");
  });

  it("advierte cuando la precisión supera 50 m", () => {
    expect(precisionBaja(51)).toBe(true);
    expect(precisionBaja(50)).toBe(false);
    expect(precisionBaja(null)).toBe(false);
  });
});

describe("duplicados por nombre y distancia", () => {
  it("encuentra el mismo nombre a menos de 15 m sin distinguir mayúsculas", () => {
    const existente = { nombre: " Parque ", lat: 4.7, lng: -74.07 };
    const candidato = { nombre: "parque", lat: 4.70005, lng: -74.07 };
    expect(buscarDuplicado(candidato, [existente])).toEqual(existente);
  });

  it("permite otro nombre o el mismo nombre a mayor distancia", () => {
    const existente = { nombre: "Parque", lat: 4.7, lng: -74.07 };
    expect(buscarDuplicado({ nombre: "Café", lat: 4.7, lng: -74.07 }, [existente])).toBeNull();
    expect(buscarDuplicado({ nombre: "Parque", lat: 4.701, lng: -74.07 }, [existente])).toBeNull();
    expect(buscarDuplicado({ nombre: " ", lat: 4.7, lng: -74.07 }, [existente])).toBeNull();
  });
});
