import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Brujula } from "@/components/Brujula";
import { Pantalla } from "@/components/Pantalla";
import { Radar, type PuntoRadarLugar } from "@/components/Radar";
import { TarjetaLugar } from "@/components/TarjetaLugar";
import { useLugares } from "@/hooks/useLugares";
import { useRumbo } from "@/sensors/useRumbo";
import { useSacudida } from "@/sensors/useSacudida";
import { useUbicacion } from "@/sensors/useUbicacion";
import { formatearDistancia, normalizarGrados, puntoEnRadar, rumboGrados } from "@/services/geo";
import { colores, espacio } from "@/theme";

const RADIO_MIN = 100;
const RADIO_MAX = 10_000;
const PASO_ZOOM = 1.6;
const PASO_GIRO = 15;

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

export default function RadarScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { lugares, recargar } = useLugares();
  const { ubicacion, error: errorUbicacion, usandoCache, solicitar } = useUbicacion();
  const [radioMetros, setRadioMetros] = useState(1000);
  const [rotacionManual, setRotacionManual] = useState(0);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [usarBrujula, setUsarBrujula] = useState(true);
  const { rumbo, disponible: brujulaDisponible } = useRumbo(usarBrujula);
  const tamano = Math.min(width - espacio.xl * 2, 340);
  const rotacion = usarBrujula && rumbo !== null ? rumbo : rotacionManual;

  const centrar = useCallback(() => {
    setDesplazamiento({ x: 0, y: 0 });
  }, []);
  useSacudida(centrar);

  const puntos = useMemo<PuntoRadarLugar[]>(() => {
    if (!ubicacion) {
      return [];
    }
    return lugares
      .map((lugar) => ({
        lugar,
        punto: puntoEnRadar(ubicacion, lugar, radioMetros, rotacion),
      }))
      .sort((a, b) => a.punto.distancia - b.punto.distancia)
      .slice(0, 40);
  }, [lugares, radioMetros, rotacion, ubicacion]);

  const activo = puntos.find(({ lugar }) => lugar.id === seleccionado) ?? null;
  const rumboActivo =
    activo && ubicacion ? rumboGrados(ubicacion, activo.lugar) : null;

  const girar = useCallback(
    (grados: number) => {
      if (usarBrujula) {
        setUsarBrujula(false);
        setRotacionManual(normalizarGrados(rotacion + grados));
        return;
      }
      setRotacionManual((actual) => normalizarGrados(actual + grados));
    },
    [rotacion, usarBrujula],
  );

  const zoom = useCallback((factor: number) => {
    setRadioMetros((actual) => limitar(actual / factor, RADIO_MIN, RADIO_MAX));
  }, []);

  const desplazar = useCallback(
    (x: number, y: number) => {
      const limite = tamano / 3;
      setDesplazamiento((actual) => ({
        x: limitar(actual.x + x, -limite, limite),
        y: limitar(actual.y + y, -limite, limite),
      }));
    },
    [tamano],
  );

  const abrir = useCallback(
    (id: number) => {
      router.push(`/lugar/${id}`);
    },
    [router],
  );

  return (
    <Pantalla refrescando={false} onRefrescar={() => void recargar()}>
      <View style={styles.cabecera}>
        <View style={styles.titulos}>
          <Text style={styles.titulo}>Radar</Text>
          <Text style={styles.subtitulo}>
            Radio {formatearDistancia(radioMetros)}
            {usandoCache ? " · ubicación guardada" : ""}
          </Text>
        </View>
        <Boton
          titulo={usarBrujula ? "Brújula" : "Norte"}
          variante={usarBrujula ? "secundario" : "fantasma"}
          icono={usarBrujula ? "compass" : "navigate"}
          onPress={() => setUsarBrujula((valor) => !valor)}
          accessibilityLabel={usarBrujula ? "Desactivar brújula" : "Activar brújula"}
          estilo={styles.botonCabecera}
        />
      </View>

      {!ubicacion ? (
        <Aviso
          tipo={errorUbicacion ? "aviso" : "info"}
          texto={
            errorUbicacion ??
            "Necesito tu ubicación para dibujar el radar. La lista sigue disponible sin GPS."
          }
          accion={{ titulo: "Activar ubicación", onPress: () => void solicitar() }}
        />
      ) : (
        <>
          <Radar
            tamano={tamano}
            puntos={puntos}
            radioMetros={radioMetros}
            rotacion={rotacion}
            desplazamiento={desplazamiento}
            seleccionado={seleccionado}
            onSeleccionar={(lugar) => setSeleccionado(lugar.id)}
            onAbrir={(lugar) => abrir(lugar.id)}
            onDesplazar={desplazar}
            onZoom={zoom}
            onRotar={girar}
          />

          <View style={styles.controles}>
            <Boton
              titulo="−"
              variante="secundario"
              onPress={() => zoom(1 / PASO_ZOOM)}
              accessibilityLabel="Alejar el radar"
              estilo={styles.control}
            />
            <Boton
              titulo="+"
              variante="secundario"
              onPress={() => zoom(PASO_ZOOM)}
              accessibilityLabel="Acercar el radar"
              estilo={styles.control}
            />
            <Boton
              titulo="⟲"
              variante="secundario"
              onPress={() => girar(-PASO_GIRO)}
              accessibilityLabel="Rotar el radar a la izquierda"
              estilo={styles.control}
            />
            <Boton
              titulo="⟳"
              variante="secundario"
              onPress={() => girar(PASO_GIRO)}
              accessibilityLabel="Rotar el radar a la derecha"
              estilo={styles.control}
            />
            <Boton
              titulo="Centrar"
              variante="secundario"
              onPress={centrar}
              accessibilityLabel="Centrar el radar en mi posición"
              estilo={styles.controlAncho}
            />
          </View>

          <Text style={styles.ayudaGestos}>
            Arrastra para mover, pellizca para el zoom, gira con dos dedos o usa los botones.
            {brujulaDisponible ? " Sacude el teléfono para centrar." : " Sin brújula: norte arriba."}
          </Text>

          <Brujula
            rumbo={rumboActivo}
            orientacion={usarBrujula && rumbo !== null ? rumbo : 0}
            distancia={activo?.punto.distancia ?? null}
            nombre={activo?.lugar.nombre ?? null}
          />

          {activo ? (
            <Boton
              titulo="Ver detalle del lugar"
              icono="open-outline"
              onPress={() => abrir(activo.lugar.id)}
            />
          ) : (
            <Text style={styles.ayudaGestos}>
              Pulsa un punto del radar (o una tarjeta) para ver la flecha y la distancia.
            </Text>
          )}

          <Text style={styles.seccion}>Más cercanos</Text>
          {puntos.slice(0, 4).map(({ lugar, punto }) => (
            <TarjetaLugar
              key={lugar.id}
              lugar={lugar}
              distancia={punto.distancia}
              onPress={() => setSeleccionado(lugar.id)}
            />
          ))}
        </>
      )}

      {!brujulaDisponible && usarBrujula ? (
        <Aviso
          tipo="info"
          texto="La brújula no está disponible en este dispositivo. Usa los botones de rotación."
        />
      ) : null}
      <View style={styles.iconoFondo}>
        <Ionicons name="compass-outline" size={16} color={colores.textoSuave} />
        <Text style={styles.ayudaGestos}>Los datos se guardan en el teléfono y se sincronizan al iniciar sesión.</Text>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: "row", alignItems: "center", gap: espacio.sm },
  titulos: { flex: 1, gap: 2 },
  titulo: { color: colores.texto, fontSize: 26, fontWeight: "800" },
  subtitulo: { color: colores.textoSuave, fontSize: 13 },
  botonCabecera: { minHeight: 40, paddingVertical: espacio.xs },
  controles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espacio.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  control: { minWidth: 48, paddingHorizontal: espacio.md, minHeight: 44 },
  controlAncho: { minHeight: 44, paddingHorizontal: espacio.md },
  ayudaGestos: { color: colores.textoSuave, fontSize: 12, lineHeight: 17 },
  seccion: {
    color: colores.texto,
    fontSize: 16,
    fontWeight: "700",
    marginTop: espacio.sm,
  },
  iconoFondo: { flexDirection: "row", alignItems: "center", gap: espacio.xs },
});
