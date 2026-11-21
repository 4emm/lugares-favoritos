import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colores, espacio, radio } from "@/theme";

type Props = TextInputProps & {
  etiqueta: string;
  error?: string | null;
  ayuda?: string | null;
};

export function Campo({ etiqueta, error, ayuda, style, ...resto }: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.textoSuave}
        style={[styles.entrada, error ? styles.entradaError : null, style]}
        {...resto}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={styles.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: espacio.xs,
  },
  etiqueta: {
    color: colores.textoSuave,
    fontSize: 13,
    fontWeight: "600",
  },
  entrada: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    color: colores.texto,
    borderRadius: radio.md,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm,
    fontSize: 15,
  },
  entradaError: {
    borderColor: colores.peligro,
  },
  error: {
    color: colores.peligro,
    fontSize: 12,
  },
  ayuda: {
    color: colores.textoSuave,
    fontSize: 12,
  },
});
