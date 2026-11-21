import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import type { LugarLocal } from "@/domain/tipos";
import { formatearDistancia, type PuntoRadar } from "@/services/geo";
import { normalizarCategoria } from "@/services/validacion";
import { colores, colorCategoria, radio as radios } from "@/theme";

export type PuntoRadarLugar = {
  lugar: LugarLocal;
  punto: PuntoRadar;
};

type Props = {
  tamano: number;
  puntos: PuntoRadarLugar[];
  radioMetros: number;
  rotacion: number;
  desplazamiento: { x: number; y: number };
  seleccionado: number | null;
  onSeleccionar: (lugar: LugarLocal) => void;
  onAbrir: (lugar: LugarLocal) => void;
  onDesplazar: (x: number, y: number) => void;
  onZoom: (factor: number) => void;
  onRotar: (grados: number) => void;
};

/**
 * Radar dibujado con SVG. Gestos: arrastre (pan) para desplazar el centro,
 * pellizco para zoom y rotación con dos dedos. Cada gesto tiene su botón en la
 * pantalla, y cada punto se puede pulsar o mantener pulsado con lector de
 * pantalla.
 */
export function Radar({
  tamano,
  puntos,
  radioMetros,
  rotacion,
  desplazamiento,
  seleccionado,
  onSeleccionar,
  onAbrir,
  onDesplazar,
  onZoom,
  onRotar,
}: Props) {
  const centro = tamano / 2;
  const radioPx = centro - 18;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const escala = useSharedValue(1);
  const giro = useSharedValue(0);
  const gesto = useMemo(
    () =>
      Gesture.Simultaneous(
        Gesture.Pan()
          .minDistance(10)
          .onUpdate((evento) => {
            dx.value = evento.translationX;
            dy.value = evento.translationY;
          })
          .onEnd(() => {
            runOnJS(onDesplazar)(dx.value, dy.value);
            dx.value = 0;
            dy.value = 0;
          }),
        Gesture.Pinch()
          .onUpdate((evento) => {
            escala.value = evento.scale;
          })
          .onEnd(() => {
            runOnJS(onZoom)(escala.value);
            escala.value = 1;
          }),
        Gesture.Rotation()
          .onUpdate((evento) => {
            giro.value = evento.rotation;
          })
          .onEnd(() => {
            runOnJS(onRotar)((giro.value * 180) / Math.PI);
            giro.value = 0;
          }),
      ),
    [dx, dy, escala, giro, onDesplazar, onZoom, onRotar],
  );

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.value },
      { translateY: dy.value },
      { scale: escala.value },
      { rotate: `${giro.value}rad` },
    ],
  }));

  const norte = {
    x: centro - Math.sin((rotacion * Math.PI) / 180) * (radioPx - 12),
    y: centro - Math.cos((rotacion * Math.PI) / 180) * (radioPx - 12),
  };

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        style={[styles.area, { width: tamano, height: tamano }, estiloAnimado]}
        accessibilityLabel={`Radar de ${puntos.length} lugares, radio ${formatearDistancia(radioMetros)}`}
      >
        <Svg width={tamano} height={tamano}>
          <G
            transform={`translate(${centro + desplazamiento.x} ${centro + desplazamiento.y})`}
          >
            <Circle
              r={radioPx}
              fill={colores.superficie}
              stroke={colores.borde}
              strokeWidth={2}
            />
            <Circle
              r={radioPx * 0.66}
              fill="none"
              stroke={colores.borde}
              strokeWidth={1}
            />
            <Circle
              r={radioPx * 0.33}
              fill="none"
              stroke={colores.borde}
              strokeWidth={1}
            />
            <Line
              x1={-radioPx}
              y1={0}
              x2={radioPx}
              y2={0}
              stroke={colores.borde}
              strokeWidth={1}
            />
            <Line
              x1={0}
              y1={-radioPx}
              x2={0}
              y2={radioPx}
              stroke={colores.borde}
              strokeWidth={1}
            />
            <Circle r={6} fill={colores.primario} />
          </G>
          <SvgText
            x={norte.x}
            y={norte.y}
            fill={colores.textoSuave}
            fontSize={12}
            fontWeight="700"
            textAnchor="middle"
          >
            N
          </SvgText>
        </Svg>

        {puntos.map(({ lugar, punto }) => {
          const categoria = normalizarCategoria(lugar.categoria);
          const color = colorCategoria[categoria] ?? colores.primario;
          const activo = seleccionado === lugar.id;
          const left = centro + desplazamiento.x + punto.x * radioPx;
          const top = centro + desplazamiento.y + punto.y * radioPx;
          return (
            <Pressable
              key={lugar.id}
              onPress={() => onSeleccionar(lugar)}
              onLongPress={() => onAbrir(lugar)}
              accessibilityRole="button"
              accessibilityLabel={`${lugar.nombre}, ${formatearDistancia(punto.distancia)}`}
              accessibilityHint="Pulsa para seleccionar y mantén pulsado para abrir el detalle"
              accessibilityState={{ selected: activo }}
              hitSlop={8}
              style={[
                styles.punto,
                {
                  left: left - 14,
                  top: top - 14,
                  borderColor: color,
                  backgroundColor: activo ? color : colores.fondo,
                  transform: [{ scale: activo ? 1.25 : 1 }],
                },
              ]}
            >
              <Text style={[styles.inicial, { color: activo ? colores.fondo : color }]}>
                {lugar.nombre.slice(0, 1).toUpperCase()}
              </Text>
            </Pressable>
          );
        })}

        {puntos.length === 0 ? (
          <View style={styles.vacio} pointerEvents="none">
            <Text style={styles.vacioTexto}>Aún no hay lugares dentro del radar</Text>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  area: {
    borderRadius: radios.pill,
    overflow: "hidden",
    alignSelf: "center",
  },
  punto: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: {
    fontSize: 12,
    fontWeight: "800",
  },
  vacio: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  vacioTexto: {
    color: colores.textoSuave,
    fontSize: 13,
    textAlign: "center",
  },
});
