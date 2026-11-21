import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Boton } from "@/components/Boton";
import { colores, espacio } from "@/theme";

type Props = {
  titulo: string;
  descripcion: string;
  icono?: React.ComponentProps<typeof Ionicons>["name"];
  accion?: { titulo: string; onPress: () => void };
};

export function EstadoVacio({ titulo, descripcion, icono = "map-outline", accion }: Props) {
  return (
    <View style={styles.caja}>
      <Ionicons name={icono} size={48} color={colores.textoSuave} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
      {accion ? <Boton titulo={accion.titulo} onPress={accion.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    alignItems: "center",
    gap: espacio.sm,
    paddingVertical: espacio.xxl,
    paddingHorizontal: espacio.lg,
  },
  titulo: {
    color: colores.texto,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  descripcion: {
    color: colores.textoSuave,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: espacio.sm,
  },
});
