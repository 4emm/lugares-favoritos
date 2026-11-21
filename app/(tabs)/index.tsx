import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mensajeDeError } from "@/api/client";
import { Aviso } from "@/components/Aviso";
import { Campo } from "@/components/Campo";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Pantalla } from "@/components/Pantalla";
import { TarjetaLugar } from "@/components/TarjetaLugar";
import { useLugares } from "@/hooks/useLugares";
import { useSesion } from "@/hooks/useSesion";
import { useUbicacion } from "@/sensors/useUbicacion";
import { distanciaMetros } from "@/services/geo";
import { servicioSync } from "@/services/contenedor";
import { colores, espacio, radio } from "@/theme";

export default function ListaScreen() {
  const router = useRouter();
  const { usuario } = useSesion();
  const { lugares, cargando, error, recargar } = useLugares();
  const { ubicacion, error: errorUbicacion, usandoCache, solicitar } = useUbicacion();
  const [texto, setTexto] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  const visibles = useMemo(() => {
    const consulta = texto.trim().toLowerCase();
    const filtrados = consulta
      ? lugares.filter(
          (lugar) =>
            lugar.nombre.toLowerCase().includes(consulta) ||
            (lugar.nota ?? "").toLowerCase().includes(consulta),
        )
      : lugares;
    return filtrados
      .map((lugar) => ({
        lugar,
        distancia: ubicacion ? distanciaMetros(ubicacion, lugar) : null,
      }))
      .sort((a, b) => (a.distancia ?? Number.POSITIVE_INFINITY) - (b.distancia ?? Number.POSITIVE_INFINITY));
  }, [lugares, texto, ubicacion]);

  const sincronizar = useCallback(async () => {
    if (!usuario) {
      router.push("/auth");
      return;
    }
    setSincronizando(true);
    setAviso(null);
    try {
      const resultado = await servicioSync.sincronizar();
      await recargar();
      setAviso(
        `Sincronizado: ${resultado.subidos} enviados y ${resultado.bajados} recibidos.`,
      );
    } catch (fallo) {
      setAviso(mensajeDeError(fallo));
    } finally {
      setSincronizando(false);
    }
  }, [recargar, router, usuario]);

  return (
    <View style={styles.raiz}>
      <Pantalla refrescando={sincronizando} onRefrescar={() => void sincronizar()}>
        <View style={styles.cabecera}>
          <View style={styles.titulos}>
            <Text style={styles.titulo}>Mis lugares</Text>
            <Text style={styles.subtitulo}>
              {visibles.length} {visibles.length === 1 ? "lugar" : "lugares"}
              {usandoCache ? " · última ubicación guardada" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/auth")}
            accessibilityRole="button"
            accessibilityLabel={usuario ? `Cuenta de ${usuario.email}` : "Iniciar sesión"}
            style={styles.cuenta}
          >
            <Ionicons
              name={usuario ? "person-circle" : "person-circle-outline"}
              size={30}
              color={usuario ? colores.exito : colores.textoSuave}
            />
          </Pressable>
        </View>

        {!usuario ? (
          <Aviso
            tipo="info"
            texto="Sin sesión, tus lugares se guardan solo en este teléfono. Inicia sesión para sincronizarlos."
            accion={{ titulo: "Iniciar sesión", onPress: () => router.push("/auth") }}
          />
        ) : null}

        {errorUbicacion ? (
          <Aviso
            tipo="aviso"
            texto={errorUbicacion}
            accion={{ titulo: "Reintentar", onPress: () => void solicitar() }}
          />
        ) : null}

        {aviso ? <Aviso tipo="exito" texto={aviso} /> : null}
        {error ? <Aviso tipo="error" texto={error} /> : null}

        <Campo
          etiqueta="Buscar"
          value={texto}
          onChangeText={setTexto}
          placeholder="Nombre o nota"
          autoCapitalize="none"
          returnKeyType="search"
        />

        {cargando ? (
          <Text style={styles.cargando}>Cargando tus lugares…</Text>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            titulo={lugares.length === 0 ? "Todavía no hay lugares" : "Sin resultados"}
            descripcion={
              lugares.length === 0
                ? "Guarda el sitio donde estás con un nombre, una categoría y una foto."
                : "Prueba con otro nombre o revisa la nota."
            }
            accion={
              lugares.length === 0
                ? { titulo: "Guardar lugar aquí", onPress: () => router.push("/lugar/nuevo") }
                : undefined
            }
          />
        ) : (
          visibles.map(({ lugar, distancia }) => (
            <TarjetaLugar
              key={lugar.id}
              lugar={lugar}
              distancia={distancia}
              onPress={() => router.push(`/lugar/${lugar.id}`)}
            />
          ))
        )}

        <Pressable
          onPress={() => void sincronizar()}
          disabled={sincronizando}
          accessibilityRole="button"
          accessibilityLabel="Sincronizar lugares con la nube"
          style={styles.sync}
        >
          <Ionicons
            name={sincronizando ? "sync" : "cloud-upload-outline"}
            size={16}
            color={colores.textoSuave}
          />
          <Text style={styles.syncTexto}>
            {sincronizando ? "Sincronizando…" : "Sincronizar ahora"}
          </Text>
        </Pressable>
      </Pantalla>

      <Pressable
        onPress={() => router.push("/lugar/nuevo")}
        accessibilityRole="button"
        accessibilityLabel="Guardar un lugar en mi ubicación actual"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPresionado]}
      >
        <Ionicons name="add" size={30} color="#04121F" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  cabecera: { flexDirection: "row", alignItems: "center", gap: espacio.md },
  titulos: { flex: 1, gap: 2 },
  titulo: { color: colores.texto, fontSize: 26, fontWeight: "800" },
  subtitulo: { color: colores.textoSuave, fontSize: 13 },
  cuenta: { padding: espacio.xs },
  cargando: { color: colores.textoSuave, fontSize: 14, paddingVertical: espacio.xl },
  sync: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espacio.xs,
    paddingVertical: espacio.md,
  },
  syncTexto: { color: colores.textoSuave, fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: espacio.lg,
    bottom: espacio.xl,
    width: 58,
    height: 58,
    borderRadius: radio.pill,
    backgroundColor: colores.primario,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPresionado: { opacity: 0.85 },
});
