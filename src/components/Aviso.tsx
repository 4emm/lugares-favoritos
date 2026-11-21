import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Boton } from "@/components/Boton";
import { colores, colorEstado, espacio, radio } from "@/theme";

type Tipo = "info" | "exito" | "error" | "aviso";

type Props = {
  texto: string;
  tipo?: Tipo;
  accion?: { titulo: string; onPress: () => void };
};

const ICONOS: Record<Tipo, React.ComponentProps<typeof Ionicons>["name"]> = {
  info: "information-circle-outline",
  exito: "checkmark-circle-outline",
  error: "alert-circle-outline",
  aviso: "warning-outline",
};

export function Aviso({ texto, tipo = "info", accion }: Props) {
  const color = colorEstado[tipo];
  return (
    <View style={[styles.caja, { borderColor: color }]}>
      <View style={styles.fila}>
        <Ionicons name={ICONOS[tipo]} size={20} color={color} />
        <Text style={styles.texto}>{texto}</Text>
      </View>
      {accion ? (
        <Boton
          titulo={accion.titulo}
          onPress={accion.onPress}
          variante="fantasma"
          estilo={styles.accion}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    borderWidth: 1,
    borderRadius: radio.md,
    padding: espacio.md,
    backgroundColor: colores.superficie,
    gap: espacio.sm,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: espacio.sm,
  },
  texto: {
    flex: 1,
    color: colores.texto,
    fontSize: 13,
    lineHeight: 19,
  },
  accion: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});
