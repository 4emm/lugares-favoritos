import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colores, espacio, radio } from "@/theme";

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: React.ComponentProps<typeof Ionicons>["name"];
  cargando?: boolean;
  deshabilitado?: boolean;
  accessibilityLabel?: string;
  estilo?: StyleProp<ViewStyle>;
};

const ESTILOS: Record<Variante, { fondo: string; borde: string; texto: string }> = {
  primario: { fondo: colores.primario, borde: colores.primario, texto: "#04121F" },
  secundario: { fondo: colores.superficieAlta, borde: colores.borde, texto: colores.texto },
  peligro: { fondo: "transparent", borde: colores.peligro, texto: colores.peligro },
  fantasma: { fondo: "transparent", borde: "transparent", texto: colores.primario },
};

/** Botón accesible: toda acción gestual tiene un equivalente por botón. */
export function Boton({
  titulo,
  onPress,
  variante = "primario",
  icono,
  cargando = false,
  deshabilitado = false,
  accessibilityLabel,
  estilo,
}: Props) {
  const paleta = ESTILOS[variante];
  const bloqueado = deshabilitado || cargando;
  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: paleta.fondo,
          borderColor: paleta.borde,
          opacity: bloqueado ? 0.5 : pressed ? 0.8 : 1,
        },
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={paleta.texto} />
      ) : (
        <>
          {icono ? <Ionicons name={icono} size={18} color={paleta.texto} /> : null}
          <Text style={[styles.texto, { color: paleta.texto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    paddingHorizontal: espacio.lg,
    paddingVertical: espacio.md,
    borderRadius: radio.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espacio.sm,
  },
  texto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
