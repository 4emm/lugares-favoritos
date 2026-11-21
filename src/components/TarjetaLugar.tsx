import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { LugarLocal } from "@/domain/tipos";
import { formatearDistancia } from "@/services/geo";
import { ETIQUETAS_CATEGORIA, normalizarCategoria } from "@/services/validacion";
import { colores, colorCategoria, espacio, radio } from "@/theme";

const ICONOS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  cafe: "cafe-outline",
  parque: "leaf-outline",
  parqueadero: "car-outline",
  restaurante: "restaurant-outline",
  tienda: "bag-outline",
  otro: "location-outline",
};

type Props = {
  lugar: LugarLocal;
  distancia?: number | null;
  onPress: () => void;
};

export function TarjetaLugar({ lugar, distancia, onPress }: Props) {
  const categoria = normalizarCategoria(lugar.categoria);
  const color = colorCategoria[categoria] ?? colores.primario;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${lugar.nombre}, ${ETIQUETAS_CATEGORIA[categoria]}${
        distancia !== null && distancia !== undefined
          ? `, a ${formatearDistancia(distancia)}`
          : ""
      }`}
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
    >
      <View style={[styles.icono, { borderColor: color }]}>
        <Ionicons
          name={ICONOS[categoria] ?? "location-outline"}
          size={20}
          color={color}
        />
      </View>
      <View style={styles.cuerpo}>
        <Text style={styles.nombre} numberOfLines={1}>
          {lugar.nombre}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.categoria}>{ETIQUETAS_CATEGORIA[categoria]}</Text>
          {distancia !== null && distancia !== undefined ? (
            <Text style={styles.distancia}>{formatearDistancia(distancia)}</Text>
          ) : (
            <Text style={styles.distancia}>
              {lugar.lat.toFixed(4)}, {lugar.lng.toFixed(4)}
            </Text>
          )}
        </View>
        {lugar.nota ? (
          <Text style={styles.nota} numberOfLines={1}>
            {lugar.nota}
          </Text>
        ) : null}
        <View style={styles.insignias}>
          {lugar.pending ? (
            <Text style={styles.insigniaPendiente}>Sin sincronizar</Text>
          ) : null}
          {lugar.publico ? <Text style={styles.insigniaPublico}>Público</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colores.textoSuave} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacio.md,
    padding: espacio.md,
    borderRadius: radio.md,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  presionada: {
    backgroundColor: colores.superficieAlta,
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: radio.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.fondo,
  },
  cuerpo: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    gap: espacio.sm,
    alignItems: "center",
  },
  categoria: {
    color: colores.textoSuave,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  distancia: {
    color: colores.primario,
    fontSize: 12,
    fontWeight: "600",
  },
  nota: {
    color: colores.textoSuave,
    fontSize: 13,
  },
  insignias: {
    flexDirection: "row",
    gap: espacio.xs,
    marginTop: 2,
  },
  insigniaPendiente: {
    color: colores.aviso,
    fontSize: 11,
    fontWeight: "600",
  },
  insigniaPublico: {
    color: colores.exito,
    fontSize: 11,
    fontWeight: "600",
  },
});
