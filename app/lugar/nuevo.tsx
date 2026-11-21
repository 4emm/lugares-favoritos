import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { mensajeDeError } from "@/api/client";
import { apiImagenes } from "@/api";
import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Campo } from "@/components/Campo";
import { Pantalla } from "@/components/Pantalla";
import { SelectorCategoria } from "@/components/SelectorCategoria";
import { prepararImagen } from "@/device/imagen";
import { useDireccion } from "@/hooks/useDireccion";
import { useSesion } from "@/hooks/useSesion";
import { useUbicacion } from "@/sensors/useUbicacion";
import { servicioLugares } from "@/services/contenedor";
import {
  PRECISION_MAXIMA_M,
  normalizarCategoria,
  type ErrorCampo,
} from "@/services/validacion";
import { colores, espacio, radio } from "@/theme";

function numeroDeTexto(texto: string): number {
  return texto.trim().length === 0 ? Number.NaN : Number(texto.replace(",", "."));
}

export default function NuevoLugarScreen() {
  const router = useRouter();
  const { usuario } = useSesion();
  const { ubicacion, error: errorUbicacion, solicitar } = useUbicacion();
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("otro");
  const [nota, setNota] = useState("");
  const [publico, setPublico] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [latTexto, setLatTexto] = useState("");
  const [lngTexto, setLngTexto] = useState("");
  const [altitudTexto, setAltitudTexto] = useState("");
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const lat = manual ? numeroDeTexto(latTexto) : (ubicacion?.lat ?? Number.NaN);
  const lng = manual ? numeroDeTexto(lngTexto) : (ubicacion?.lng ?? Number.NaN);
  const altitud = manual
    ? numeroDeTexto(altitudTexto)
    : (ubicacion?.altitud_m ?? Number.NaN);
  const direccion = useDireccion(
    Number.isFinite(lat) ? lat : null,
    Number.isFinite(lng) ? lng : null,
  );
  const precision = manual ? null : (ubicacion?.precision_m ?? null);
  const errorDe = (campo: string) =>
    errores.find((error) => error.campo === campo)?.mensaje ?? null;

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setAviso("Necesito permiso para acceder a tus fotos.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!resultado.canceled) {
      setFoto(resultado.assets[0]?.uri ?? null);
    }
  };

  const guardar = async () => {
    setAviso(null);
    setGuardando(true);
    let fotoUri = foto;
    let fotoUrl: string | null = null;
    try {
      if (foto && usuario) {
        try {
          const preparada = await prepararImagen(foto);
          const subida = await apiImagenes.subir(preparada.bytes, preparada.contentType);
          fotoUri = preparada.uri;
          fotoUrl = subida.url;
        } catch (fallo) {
          setAviso(`La foto quedó solo en el teléfono: ${mensajeDeError(fallo)}`);
        }
      }
      const resultado = await servicioLugares.crear({
        nombre,
        categoria: normalizarCategoria(categoria),
        lat,
        lng,
        altitud_m: Number.isFinite(altitud) ? altitud : null,
        nota: nota.trim().length > 0 ? nota : null,
        publico,
        foto_uri: fotoUri,
        foto_url: fotoUrl,
      });
      if (!resultado.ok) {
        setErrores(resultado.errores);
        return;
      }
      router.replace(`/lugar/${resultado.id}`);
    } catch (fallo) {
      setAviso(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla>
      {!manual && !ubicacion ? (
        <Aviso
          tipo="aviso"
          texto={errorUbicacion ?? "Aún no tengo tu ubicación. Actívala o ingresa las coordenadas."}
          accion={{ titulo: "Activar ubicación", onPress: () => void solicitar() }}
        />
      ) : null}

      {precision !== null && precision > PRECISION_MAXIMA_M ? (
        <Aviso
          tipo="aviso"
          texto={`Precisión baja (±${Math.round(precision)} m). Espera un momento o guarda igualmente; el punto puede quedar desviado.`}
        />
      ) : null}

      {aviso ? <Aviso tipo="info" texto={aviso} /> : null}

      <Campo
        etiqueta="Nombre *"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Café de la esquina"
        error={errorDe("nombre")}
        maxLength={120}
        autoFocus
      />

      <View style={styles.bloque}>
        <Text style={styles.etiqueta}>Categoría</Text>
        <SelectorCategoria
          valor={categoria}
          onCambiar={(valor) => setCategoria(valor)}
        />
      </View>

      <Campo
        etiqueta="Nota"
        value={nota}
        onChangeText={setNota}
        placeholder="¿Por qué quieres volver?"
        multiline
        numberOfLines={3}
        maxLength={1000}
        error={errorDe("nota")}
        ayuda={`${nota.length}/1000`}
        style={styles.area}
      />

      <View style={styles.fila}>
        <View style={styles.filaTexto}>
          <Text style={styles.etiqueta}>Lugar público</Text>
          <Text style={styles.ayuda}>Se copia a la lista pública de la API.</Text>
        </View>
        <Switch
          value={publico}
          onValueChange={setPublico}
          accessibilityLabel="Marcar el lugar como público"
          trackColor={{ false: colores.borde, true: colores.primarioOscuro }}
          thumbColor={publico ? colores.primario : colores.textoSuave}
        />
      </View>

      <View style={styles.coordenadas}>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Ubicación</Text>
          <Pressable
            onPress={() => setManual((valor) => !valor)}
            accessibilityRole="button"
            accessibilityLabel={manual ? "Usar la ubicación del GPS" : "Ingresar coordenadas manualmente"}
          >
            <Text style={styles.enlace}>{manual ? "Usar GPS" : "Ingresar manual"}</Text>
          </Pressable>
        </View>
        {manual ? (
          <>
            <Campo
              etiqueta="Latitud *"
              value={latTexto}
              onChangeText={setLatTexto}
              keyboardType="numbers-and-punctuation"
              placeholder="4.7110"
              error={errorDe("lat")}
            />
            <Campo
              etiqueta="Longitud *"
              value={lngTexto}
              onChangeText={setLngTexto}
              keyboardType="numbers-and-punctuation"
              placeholder="-74.0721"
              error={errorDe("lng")}
            />
            <Campo
              etiqueta="Altitud (m)"
              value={altitudTexto}
              onChangeText={setAltitudTexto}
              keyboardType="numbers-and-punctuation"
              placeholder="2600"
              error={errorDe("altitud_m")}
            />
          </>
        ) : (
          <Text style={styles.dato}>
            {Number.isFinite(lat) && Number.isFinite(lng)
              ? `${lat.toFixed(6)}, ${lng.toFixed(6)}${
                  Number.isFinite(altitud) ? ` · ${Math.round(altitud)} m` : ""
                }`
              : "Sin coordenadas todavía"}
          </Text>
        )}
        {direccion ? <Text style={styles.ayuda}>{direccion}</Text> : null}
      </View>

      <View style={styles.bloque}>
        <Text style={styles.etiqueta}>Foto</Text>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.foto} contentFit="cover" />
        ) : null}
        <Boton
          titulo={foto ? "Cambiar foto" : "Elegir foto"}
          variante="secundario"
          icono="image-outline"
          onPress={() => void elegirFoto()}
        />
      </View>

      <Boton
        titulo="Guardar lugar"
        icono="save-outline"
        onPress={() => void guardar()}
        cargando={guardando}
        deshabilitado={!Number.isFinite(lat) || !Number.isFinite(lng)}
      />
      <View style={styles.notaFinal}>
        <Ionicons name="information-circle-outline" size={16} color={colores.textoSuave} />
        <Text style={styles.ayuda}>
          Se guarda primero en el teléfono. Si no hay conexión, se sincroniza después.
        </Text>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: espacio.xs },
  etiqueta: { color: colores.textoSuave, fontSize: 13, fontWeight: "600" },
  ayuda: { color: colores.textoSuave, fontSize: 12, lineHeight: 17, flex: 1 },
  area: { minHeight: 90, textAlignVertical: "top" },
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: espacio.md },
  filaTexto: { flex: 1, gap: 2 },
  coordenadas: {
    gap: espacio.sm,
    padding: espacio.md,
    borderRadius: radio.md,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  enlace: { color: colores.primario, fontSize: 13, fontWeight: "700" },
  dato: { color: colores.texto, fontSize: 14, fontVariant: ["tabular-nums"] },
  foto: { width: "100%", height: 180, borderRadius: radio.md, backgroundColor: colores.superficie },
  notaFinal: { flexDirection: "row", alignItems: "flex-start", gap: espacio.xs, paddingBottom: espacio.xl },
});
