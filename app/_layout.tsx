import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SesionProvider } from "@/hooks/useSesion";
import { colores } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SesionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colores.fondo },
            headerTintColor: colores.texto,
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colores.fondo },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ title: "Cuenta", presentation: "modal" }} />
          <Stack.Screen name="lugar/nuevo" options={{ title: "Guardar lugar" }} />
          <Stack.Screen name="lugar/[id]" options={{ title: "Detalle del lugar" }} />
        </Stack>
      </SesionProvider>
    </GestureHandlerRootView>
  );
}
