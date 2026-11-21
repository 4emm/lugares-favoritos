import { formatearDireccion } from "@/services/direccion";

const DIRECCION = {
  name: "Edificio Central",
  street: "Carrera 7",
  streetNumber: "12-34",
  district: "Chapinero",
  city: "Bogotá",
  region: "Bogotá D.C.",
  country: "Colombia",
};

describe("formatearDireccion", () => {
  it("combina las partes disponibles", () => {
    expect(formatearDireccion(DIRECCION)).toBe(
      "Edificio Central, Carrera 7 12-34, Chapinero, Bogotá, Bogotá D.C., Colombia",
    );
  });

  it("omite datos ausentes y evita repeticiones", () => {
    expect(
      formatearDireccion({
        ...DIRECCION,
        name: null,
        street: null,
        streetNumber: null,
        district: null,
        city: "Bogotá",
        region: "Bogotá",
        country: null,
      }),
    ).toBe("Bogotá");
  });

  it("devuelve null sin información útil", () => {
    expect(formatearDireccion(null)).toBeNull();
    expect(
      formatearDireccion({
        name: " ",
        street: null,
        streetNumber: null,
        district: null,
        city: null,
        region: null,
        country: null,
      }),
    ).toBeNull();
  });
});
