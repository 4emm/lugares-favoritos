import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from "react-native";

import { apiImagenes } from "@/api";
import { mensajeDeError } from "@/api/client";
import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Pantalla } from "@/components/Pantalla";
import type { LugarLocal } from "@/domain/tipos";
import { useDireccion } from "@/hooks/useDireccion";
import { useSesion } from "@/hooks/useSesion";
import { useUbicacion } from "@/sensors/useUbicacion";
import { servicioLugares } from "@/services/contenedor";
import { distanciaMetros, formatearDistancia, rumboGrados } from "@/services/geo";
import { ETIQUETAS_CATEGORIA, normalizarCategoria } from "@/services/validacion";
import { colores, espacio, radio } from "@/theme";

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? "Fecha no disponible"
    : fecha.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default function DetalleLugarScreen() {
  const router = useRouter();
  const { id: textoId } = useLocalSearchParams<{ id: string }>();
  const id = Number(textoId);
  const { usuario } = useSesion();
  const { ubicacion } = useUbicacion(false);
  const [lugar, setLugar] = useState<LugarLocal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const direccion = useDireccion(lugar?.lat ?? null, lugar?.lng ?? null);

  const cargar = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setCargando(false);
      return;
    }
    try {
      setLugar(await servicioLugares.obtener(id));
    } catch (fallo) {
      setAviso(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const cambiarPublico = async (publico: boolean) => {
    if (!lugar) {
      return;
    }
    setOcupado(true);
    try {
      await servicioLugares.cambiarPublico(lugar.id, publico);
      await cargar();
      setAviso("Cambio guardado. Se enviará a la nube en la próxima sincronización.");
    } catch (fallo) {
      setAviso(mensajeDeError(fallo));
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async () => {
    if (!lugar) {
      return;
    }
    setOcupado(true);
    try {
      if (usuario && lugar.foto_url) {
        await apiImagenes.borrar(lugar.foto_url).catch(() => undefined);
      }
      await servicioLugares.eliminar(lugar.id);
      router.back();
    } catch (fallo) {
      setAviso(mensajeDeError(fallo));
      setOcupado(false);
    }
  };

  const confirmarEliminar = () => {
    Alert.alert(
      "Eliminar lugar",
      "Se marcará como eliminado y el cambio se propagará al sincronizar.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => void eliminar() },
      ],
    );
  };

  const abrirMapas = async () => {
    if (!lugar) {
      return;
    }
    const { lat, lng, nombre } = lugar;
    const nativa = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(nombre)}@${lat},${lng}`,
      default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(nombre)})`,
    });
    try {
      await Linking.openURL(nativa);
    } catch {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  };

  if (cargando) {
    return (
      <Pantalla scroll={false}>
        <Text style={styles.secundario}>Cargando lugar…</Text>
      </Pantalla>
    );
  }

  if (!lugar || lugar.deleted) {
    return (
      <Pantalla>
        <Aviso tipo="error" texto="No se encontró este lugar o ya fue eliminado." />
        <Boton titulo="Volver" variante="secundario" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  const categoria = normalizarCategoria(lugar.categoria);
  const distancia = ubicacion ? distanciaMetros(ubicacion, lugar) : null;
  const rumbo = ubicacion ? rumboGrados(ubicacion, lugar) : null;
  const foto = lugar.foto_url ?? lugar.foto_uri;

  return (
    <Pantalla>
      {foto ? <Image source={{ uri: foto }} style={styles.foto} contentFit="cover" /> : null}
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{lugar.nombre}</Text>
        <Text style={styles.categoria}>{ETIQUETAS_CATEGORIA[categoria]}</Text>
      </View>

      {aviso ? <Aviso tipo="info" texto={aviso} /> : null}

      <View style={styles.insignias}>
        <Text style={[styles.insignia, lugar.pending && styles.pendiente]}>
          {lugar.pending ? "Pendiente de sincronizar" : "Sincronizado"}
        </Text>
        {lugar.publico ? <Text style={styles.publico}>Público</Text> : null}
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.distancia}>
          {distancia === null ? "Distancia no disponible" : formatearDistancia(distancia)}
        </Text>
        {rumbo !== null ? <Text style={styles.secundario}>Rumbo {Math.round(rumbo)}°</Text> : null}
        <Text style={styles.dato}>
          {lugar.lat.toFixed(6)}, {lugar.lng.toFixed(6)}
        </Text>
        <Text style={styles.secundario}>
          Altitud: {lugar.altitud_m === null ? "no disponible" : `${Math.round(lugar.altitud_m)} m`}
        </Text>
        {direccion ? <Text style={styles.direccion}>{direccion}</Text> : null}
      </View>

      {lugar.nota ? <Text style={styles.nota}>{lugar.nota}</Text> : null}

      <View style={styles.fila}>
        <View style={styles.filaTexto}>
          <Text style={styles.etiqueta}>Lugar público</Text>
          <Text style={styles.secundario}>Visible en la lista pública de la API</Text>
        </View>
        <Switch
          value={lugar.publico}
          disabled={ocupado}
          onValueChange={(valor) => void cambiarPublico(valor)}
          accessibilityLabel="Cambiar visibilidad pública"
          trackColor={{ false: colores.borde, true: colores.primarioOscuro }}
          thumbColor={lugar.publico ? colores.primario : colores.textoSuave}
        />
      </View>

      <Boton titulo="Abrir en mapas" icono="map-outline" onPress={() => void abrirMapas()} />
      <Boton
        titulo="Eliminar lugar"
        variante="peligro"
        icono="trash-outline"
        onPress={confirmarEliminar}
        cargando={ocupado}
      />
      <View style={styles.pie}>
        <Ionicons name="time-outline" size={15} color={colores.textoSuave} />
        <Text style={styles.secundario}>Guardado: {formatearFecha(lugar.creado_en)}</Text>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: { width: "100%", height: 230, borderRadius: radio.lg, backgroundColor: colores.superficie },
  cabecera: { gap: espacio.xs },
  titulo: { color: colores.texto, fontSize: 28, fontWeight: "800" },
  categoria: { color: colores.primario, fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  insignias: { flexDirection: "row", gap: espacio.sm },
  insignia: { color: colores.exito, fontSize: 12, fontWeight: "700" },
  pendiente: { color: colores.aviso },
  publico: { color: colores.primario, fontSize: 12, fontWeight: "700" },
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.lg,
    borderRadius: radio.md,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  distancia: { color: colores.primario, fontSize: 22, fontWeight: "800" },
  dato: { color: colores.texto, fontSize: 15, fontVariant: ["tabular-nums"] },
  direccion: { color: colores.textoSuave, fontSize: 13, lineHeight: 18 },
  nota: { color: colores.texto, fontSize: 16, lineHeight: 24 },
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.md },
  filaTexto: { flex: 1, gap: 2 },
  etiqueta: { color: colores.texto, fontSize: 15, fontWeight: "700" },
  secundario: { color: colores.textoSuave, fontSize: 13 },
  pie: { flexDirection: "row", alignItems: "center", gap: espacio.xs, paddingBottom: espacio.xl },
});
