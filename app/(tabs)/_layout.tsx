import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colores } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
        },
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mis lugares",
          tabBarLabel: "Lugares",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="list-outline"
              color={focused ? colores.primario : colores.textoSuave}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          title: "Radar",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="compass-outline"
              color={focused ? colores.primario : colores.textoSuave}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
