import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colores, espacio } from "@/theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refrescando?: boolean;
  onRefrescar?: () => void;
  estilo?: StyleProp<ViewStyle>;
};

/** Contenedor común: área segura, fondo y desplazamiento opcional. */
export function Pantalla({ children, scroll = true, refrescando, onRefrescar, estilo }: Props) {
  const contenido = <View style={[styles.contenido, estilo]}>{children}</View>;
  return (
    <SafeAreaView style={styles.seguro} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefrescar ? (
              <RefreshControl
                refreshing={refrescando ?? false}
                onRefresh={onRefrescar}
                tintColor={colores.primario}
                colors={[colores.primario]}
              />
            ) : undefined
          }
        >
          {contenido}
        </ScrollView>
      ) : (
        contenido
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  scroll: {
    flexGrow: 1,
    padding: espacio.lg,
  },
  contenido: {
    flex: 1,
    gap: espacio.md,
  },
});
