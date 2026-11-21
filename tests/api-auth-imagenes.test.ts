import { aSesion, aSesionRenovada, crearApiAuth } from "@/api/auth";
import type { ClienteApi } from "@/api/client";
import { crearApiImagenes } from "@/api/imagenes";

const SESION = {
  token: "id-token",
  refreshToken: "refresh-token",
  expiraEnSeg: 3600,
  usuario: { id: "uid", email: "a@b.co" },
};

function cliente() {
  const mock: ClienteApi = {
    solicitar: jest.fn().mockResolvedValue({ url: "https://blob.test/a.jpg", pathname: "usuarios/u/a.jpg" }),
    get: jest.fn().mockResolvedValue({ usuario: SESION.usuario }),
    post: jest.fn().mockImplementation(async (ruta: string) =>
      ruta.endsWith("refresh")
        ? { token: "nuevo", refreshToken: "nuevo-r", expiraEnSeg: 3600 }
        : SESION,
    ),
    put: jest.fn(),
    delete: jest.fn().mockResolvedValue({ ok: true }),
  };
  return mock;
}

describe("API de autenticación", () => {
  it("valida sesiones completas y renovadas", () => {
    expect(aSesion(SESION)).toEqual(SESION);
    expect(aSesionRenovada({ token: "t", refreshToken: "r", expiraEnSeg: 10 })).toEqual({
      token: "t",
      refreshToken: "r",
      expiraEnSeg: 10,
    });
    expect(() => aSesion(null)).toThrow();
    expect(() => aSesion({ ...SESION, usuario: null })).toThrow();
    expect(() => aSesionRenovada({})).toThrow();
  });

  it("llama los endpoints de registro, login, refresh y yo", async () => {
    const http = cliente();
    const api = crearApiAuth(http);
    expect((await api.registro("a@b.co", "12345678")).usuario.id).toBe("uid");
    expect(http.post).toHaveBeenLastCalledWith("/api/auth/registro", {
      email: "a@b.co",
      password: "12345678",
    });
    await api.login("a@b.co", "12345678");
    expect(http.post).toHaveBeenLastCalledWith("/api/auth/login", {
      email: "a@b.co",
      password: "12345678",
    });
    expect((await api.refresh("r")).token).toBe("nuevo");
    expect(await api.yo()).toEqual(SESION.usuario);
  });

  it("rechaza una respuesta inválida de yo", async () => {
    const http = cliente();
    (http.get as jest.MockedFunction<ClienteApi["get"]>).mockResolvedValue(null);
    await expect(crearApiAuth(http).yo()).rejects.toThrow("respuesta inesperada");
  });
});

describe("API de imágenes", () => {
  it("sube bytes con su content-type y valida la respuesta", async () => {
    const http = cliente();
    const api = crearApiImagenes(http);
    const cuerpo = new ArrayBuffer(4);
    expect(await api.subir(cuerpo, "image/jpeg")).toEqual({
      url: "https://blob.test/a.jpg",
      pathname: "usuarios/u/a.jpg",
    });
    expect(http.solicitar).toHaveBeenCalledWith("/api/imagenes", {
      method: "POST",
      cuerpo,
      contentType: "image/jpeg",
    });
  });

  it("borra por URL codificada y rechaza respuestas inválidas", async () => {
    const http = cliente();
    const api = crearApiImagenes(http);
    await api.borrar("https://blob.test/a b.jpg");
    expect(http.delete).toHaveBeenCalledWith(
      `/api/imagenes?url=${encodeURIComponent("https://blob.test/a b.jpg")}`,
    );
    (http.solicitar as jest.MockedFunction<ClienteApi["solicitar"]>).mockResolvedValue(null);
    await expect(api.subir(new ArrayBuffer(1), "image/png")).rejects.toThrow();
  });
});
