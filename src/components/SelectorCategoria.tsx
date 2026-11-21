import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/services/validacion";
import { colores, espacio, radio } from "@/theme";

const ICONOS: Record<Categoria, React.ComponentProps<typeof Ionicons>["name"]> = {
  cafe: "cafe-outline",
  parque: "leaf-outline",
  parqueadero: "car-outline",
  restaurante: "restaurant-outline",
  tienda: "bag-outline",
  otro: "location-outline",
};

type Props = {
  valor: string;
  onCambiar: (categoria: Categoria) => void;
};

export function SelectorCategoria({ valor, onCambiar }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      {CATEGORIAS.map((categoria) => {
        const activa = valor === categoria;
        return (
          <Pressable
            key={categoria}
            onPress={() => onCambiar(categoria)}
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={`Categoría ${ETIQUETAS_CATEGORIA[categoria]}`}
            style={[styles.chip, activa && styles.chipActiva]}
          >
            <Ionicons
              name={ICONOS[categoria]}
              size={16}
              color={activa ? "#04121F" : colores.textoSuave}
            />
            <Text style={[styles.texto, activa && styles.textoActivo]}>
              {ETIQUETAS_CATEGORIA[categoria]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: {
    gap: espacio.sm,
    paddingVertical: espacio.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacio.xs,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm,
    borderRadius: radio.pill,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  chipActiva: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  texto: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: "600",
  },
  textoActivo: {
    color: "#04121F",
  },
});
