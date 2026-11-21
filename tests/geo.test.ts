import {
  aRadianes,
  distanciaMetros,
  formatearDistancia,
  normalizarGrados,
  puntoEnRadar,
  rumboGrados,
} from "@/services/geo";

const CENTRO = { lat: 0, lng: 0 };

describe("geo: distancia y rumbo", () => {
  it("calcula una distancia haversine cercana a 111 m por 0,001°", () => {
    expect(distanciaMetros(CENTRO, { lat: 0.001, lng: 0 })).toBeCloseTo(111.19, 1);
    expect(distanciaMetros(CENTRO, CENTRO)).toBe(0);
  });

  it("calcula los cuatro rumbos cardinales", () => {
    expect(rumboGrados(CENTRO, { lat: 0.01, lng: 0 })).toBeCloseTo(0, 5);
    expect(rumboGrados(CENTRO, { lat: 0, lng: 0.01 })).toBeCloseTo(90, 5);
    expect(rumboGrados(CENTRO, { lat: -0.01, lng: 0 })).toBeCloseTo(180, 5);
    expect(rumboGrados(CENTRO, { lat: 0, lng: -0.01 })).toBeCloseTo(270, 5);
  });

  it("normaliza ángulos y convierte a radianes", () => {
    expect(normalizarGrados(-90)).toBe(270);
    expect(normalizarGrados(450)).toBe(90);
    expect(aRadianes(180)).toBe(Math.PI);
  });
});

describe("geo: conversión al radar", () => {
  it("ubica el norte arriba y el este a la derecha", () => {
    const norte = puntoEnRadar(CENTRO, { lat: 0.001, lng: 0 }, 1000);
    const este = puntoEnRadar(CENTRO, { lat: 0, lng: 0.001 }, 1000);
    expect(norte.x).toBeCloseTo(0, 6);
    expect(norte.y).toBeLessThan(0);
    expect(este.x).toBeGreaterThan(0);
    expect(este.y).toBeCloseTo(0, 6);
    expect(norte.dentro).toBe(true);
  });

  it("limita los puntos lejanos al borde y aplica la rotación", () => {
    const lejano = puntoEnRadar(CENTRO, { lat: 0.02, lng: 0 }, 1000);
    expect(lejano.dentro).toBe(false);
    expect(Math.hypot(lejano.x, lejano.y)).toBeCloseTo(1, 6);
    const girado = puntoEnRadar(CENTRO, { lat: 0.001, lng: 0 }, 1000, 90);
    expect(girado.x).toBeLessThan(0);
    expect(girado.y).toBeCloseTo(0, 6);
  });

  it("evita dividir por un radio no positivo", () => {
    const punto = puntoEnRadar(CENTRO, CENTRO, 0);
    expect(punto.x).toBe(0);
    expect(punto.y).toBeCloseTo(0, 6);
  });
});

describe("geo: formato", () => {
  it("formatea metros y kilómetros", () => {
    expect(formatearDistancia(42.4)).toBe("42 m");
    expect(formatearDistancia(1500)).toBe("1,5 km");
    expect(formatearDistancia(12_000)).toBe("12 km");
  });

  it("rechaza valores inválidos", () => {
    expect(formatearDistancia(-1)).toBe("—");
    expect(formatearDistancia(Number.NaN)).toBe("—");
  });
});
