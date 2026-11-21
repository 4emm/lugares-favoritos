import { crearClienteApi, ErrorApi, mensajeDeError } from "@/api/client";

function respuesta(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("cliente HTTP", () => {
  it("hace GET, agrega el Bearer y parsea JSON", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(respuesta({ ok: true }));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test/",
      fetchImpl: fetchMock,
      obtenerToken: async () => "token-123",
    });
    expect(await cliente.get("api/auth/yo")).toEqual({ ok: true });
    const [url, opciones] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.test/api/auth/yo");
    expect(opciones?.method).toBe("GET");
    expect(new Headers(opciones?.headers).get("authorization")).toBe("Bearer token-123");
  });

  it("serializa POST y PUT como JSON y admite cuerpo binario", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(respuesta({}));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
    });
    await cliente.post("/api/auth/login", { email: "a@b.co" });
    await cliente.put("/api/lugares/id", { nombre: "Casa" });
    await cliente.solicitar("/api/imagenes", {
      method: "POST",
      cuerpo: new ArrayBuffer(3),
      contentType: "image/jpeg",
    });
    const llamadas = fetchMock.mock.calls;
    expect(new Headers(llamadas[0]?.[1]?.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(llamadas[0]?.[1]?.body).toBe(JSON.stringify({ email: "a@b.co" }));
    expect(llamadas[1]?.[1]?.method).toBe("PUT");
    expect(new Headers(llamadas[2]?.[1]?.headers).get("content-type")).toBe("image/jpeg");
  });

  it("convierte errores de la API con mensaje y detalles", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(
        respuesta(
          {
            error: "Datos inválidos",
            detalles: [{ campo: "lat", mensaje: "Fuera de rango" }],
          },
          400,
        ),
      );
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
    });
    const error = await cliente.get("/api/lugares").catch((fallo: unknown) => fallo);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({
      status: 400,
      message: "Datos inválidos",
      detalles: [{ campo: "lat", mensaje: "Fuera de rango" }],
    });
  });

  it("usa un mensaje de respaldo si el cuerpo de error no es JSON", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(new Response("no-json", { status: 503 }));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
    });
    await expect(cliente.get("/api/health")).rejects.toMatchObject({
      status: 503,
      message: "Error 503",
    });
  });

  it("renueva una sola vez ante 401 y reintenta la petición", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(respuesta({ error: "Expirado" }, 401))
      .mockResolvedValueOnce(respuesta({ usuario: { id: "u", email: "a@b.co" } }));
    const refrescarToken = jest.fn().mockResolvedValue("nuevo-token");
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
      obtenerToken: async () => "viejo-token",
      refrescarToken,
    });
    expect(await cliente.get("/api/auth/yo")).toEqual({
      usuario: { id: "u", email: "a@b.co" },
    });
    expect(refrescarToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("devuelve 401 si no se puede renovar", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(respuesta({}, 401));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
      refrescarToken: async () => null,
    });
    await expect(cliente.get("/api/auth/yo")).rejects.toMatchObject({
      status: 401,
      message: "La sesión expiró. Vuelve a iniciar sesión.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no entra en bucle si el reintento también devuelve 401", async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(respuesta({ error: "No" }, 401));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
      refrescarToken: async () => "nuevo",
    });
    await expect(cliente.get("/api/auth/yo")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maneja red caída, URL ausente, 204 y JSON inválido exitoso", async () => {
    const red = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockRejectedValue(new TypeError("offline")),
    });
    await expect(red.get("/api/health")).rejects.toMatchObject({ status: 0 });
    await expect(
      crearClienteApi({ baseUrl: "" }).get("/api/health"),
    ).rejects.toMatchObject({
      status: 0,
    });
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("no-json", { status: 200 }));
    const cliente = crearClienteApi({
      baseUrl: "https://api.test",
      fetchImpl: fetchMock,
    });
    expect(await cliente.delete("/api/lugares/id")).toBeNull();
    expect(await cliente.get("/api/lugares")).toBeNull();
  });

  it("extrae mensajes de errores desconocidos", () => {
    expect(mensajeDeError(new Error("Fallo"))).toBe("Fallo");
    expect(mensajeDeError(new Error(""))).toBe("Ocurrió un error inesperado");
    expect(mensajeDeError("texto")).toBe("Ocurrió un error inesperado");
  });
});
