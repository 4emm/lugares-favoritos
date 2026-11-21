import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { mensajeDeError } from "@/api/client";
import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Campo } from "@/components/Campo";
import { Pantalla } from "@/components/Pantalla";
import { useSesion } from "@/hooks/useSesion";
import { colores, espacio, radio } from "@/theme";

export default function AuthScreen() {
  const router = useRouter();
  const { usuario, iniciarSesion, registrarse, cerrarSesion } = useSesion();
  const [registro, setRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  const enviar = async () => {
    const correo = email.trim().toLowerCase();
    if (!correo.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      if (registro) {
        await registrarse(correo, password);
      } else {
        await iniciarSesion(correo, password);
      }
      volver();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  };

  if (usuario) {
    return (
      <Pantalla>
        <View style={styles.cuenta}>
          <Ionicons name="person-circle" size={64} color={colores.exito} />
          <Text style={styles.titulo}>Sesión activa</Text>
          <Text style={styles.email}>{usuario.email}</Text>
          <Text style={styles.ayuda}>
            Tus lugares locales se pueden sincronizar con esta cuenta.
          </Text>
        </View>
        <Boton
          titulo="Cerrar sesión"
          variante="peligro"
          icono="log-out-outline"
          onPress={() => {
            void cerrarSesion().then(volver);
          }}
        />
        <Boton titulo="Volver" variante="secundario" onPress={volver} />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <View style={styles.icono}>
          <Ionicons name="cloud-upload-outline" size={34} color={colores.primario} />
        </View>
        <Text style={styles.titulo}>{registro ? "Crea tu cuenta" : "Bienvenido"}</Text>
        <Text style={styles.ayuda}>
          Inicia sesión para guardar una copia de tus lugares y recuperarlos en otro dispositivo.
        </Text>
      </View>

      {error ? <Aviso tipo="error" texto={error} /> : null}

      <Campo
        etiqueta="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Campo
        etiqueta="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={registro ? "new-password" : "current-password"}
        textContentType={registro ? "newPassword" : "password"}
      />
      <Boton
        titulo={registro ? "Crear cuenta" : "Iniciar sesión"}
        onPress={() => void enviar()}
        cargando={cargando}
        icono={registro ? "person-add-outline" : "log-in-outline"}
      />
      <Boton
        titulo={registro ? "Ya tengo una cuenta" : "Crear una cuenta nueva"}
        variante="fantasma"
        onPress={() => {
          setRegistro((valor) => !valor);
          setError(null);
        }}
      />
      <Text style={styles.pie}>
        La app funciona sin conexión. Tu contraseña solo se envía por HTTPS a la API y nunca se
        guarda en el teléfono.
      </Text>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: { alignItems: "center", gap: espacio.sm, paddingVertical: espacio.xl },
  icono: {
    width: 68,
    height: 68,
    borderRadius: radio.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cuenta: { alignItems: "center", gap: espacio.sm, paddingVertical: espacio.xxl },
  titulo: { color: colores.texto, fontSize: 26, fontWeight: "800", textAlign: "center" },
  email: { color: colores.primario, fontSize: 16, fontWeight: "600" },
  ayuda: { color: colores.textoSuave, fontSize: 14, lineHeight: 20, textAlign: "center" },
  pie: { color: colores.textoSuave, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
