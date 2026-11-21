import {
  arreglo,
  booleano,
  cadena,
  cadenaONull,
  cadenaOpcional,
  esObjeto,
  leerDetalles,
  leerMensajeError,
  numero,
  numeroONull,
  respuestaInvalida,
} from "@/api/validar";

describe("validadores de respuestas", () => {
  it("distingue objetos de arreglos y null", () => {
    expect(esObjeto({})).toBe(true);
    expect(esObjeto([])).toBe(false);
    expect(esObjeto(null)).toBe(false);
    expect(esObjeto("texto")).toBe(false);
  });

  it("lee o rechaza cadenas y números", () => {
    expect(cadena("valor", "campo")).toBe("valor");
    expect(() => cadena("", "campo")).toThrow("Falta el campo campo");
    expect(() => cadena(3, "campo")).toThrow();
    expect(cadenaOpcional("real", "defecto")).toBe("real");
    expect(cadenaOpcional(null, "defecto")).toBe("defecto");
    expect(cadenaONull("real")).toBe("real");
    expect(cadenaONull("")).toBeNull();
    expect(numero(2.5, "lat")).toBe(2.5);
    expect(() => numero("2", "lat")).toThrow("El campo lat no es un número válido");
    expect(numeroONull(2)).toBe(2);
    expect(numeroONull(Number.NaN)).toBeNull();
  });

  it("usa valores por defecto para booleanos y arreglos", () => {
    expect(booleano(false, true)).toBe(false);
    expect(booleano("false", true)).toBe(true);
    expect(arreglo([1])).toEqual([1]);
    expect(arreglo(null)).toEqual([]);
    expect(respuestaInvalida().message).toBe("La API devolvió una respuesta inesperada");
  });

  it("interpreta errores y detalles sin confiar en su forma", () => {
    expect(leerMensajeError({ error: "Mensaje" })).toBe("Mensaje");
    expect(leerMensajeError({ error: "" })).toBeNull();
    expect(leerMensajeError(null)).toBeNull();
    expect(leerDetalles(null)).toEqual([]);
    expect(leerDetalles({ detalles: "no" })).toEqual([]);
    expect(
      leerDetalles({
        detalles: [
          { campo: "lat", mensaje: "Inválida" },
          { campo: "lng" },
          { mensaje: "Sin campo" },
          "otro",
        ],
      }),
    ).toEqual([
      { campo: "lat", mensaje: "Inválida" },
      { campo: "lng", mensaje: "Valor inválido" },
    ]);
  });
});
