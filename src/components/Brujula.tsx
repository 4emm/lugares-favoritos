import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";

import { formatearDistancia, normalizarGrados } from "@/services/geo";
import { colores } from "@/theme";

type Props = {
  /** Rumbo absoluto al lugar seleccionado (0 = norte). */
  rumbo: number | null;
  /** Orientación del teléfono; 0 si no hay brújula. */
  orientacion: number;
  distancia: number | null;
  nombre: string | null;
};

/**
 * Flecha que apunta al lugar seleccionado. Si hay brújula se resta la
 * orientación del teléfono; sin brújula queda el norte arriba como respaldo.
 */
export function Brujula({ rumbo, orientacion, distancia, nombre }: Props) {
  const relativo = rumbo === null ? null : normalizarGrados(rumbo - orientacion);
  return (
    <View style={styles.caja}>
      <Svg width={120} height={120} accessibilityLabel="Brújula hacia el lugar seleccionado">
        <Circle cx={60} cy={60} r={52} fill={colores.superficie} stroke={colores.borde} />
        <SvgText x={60} y={16} fill={colores.textoSuave} fontSize={10} textAnchor="middle">
          N
        </SvgText>
        <SvgText x={60} y={114} fill={colores.textoSuave} fontSize={10} textAnchor="middle">
          S
        </SvgText>
        <SvgText x={8} y={64} fill={colores.textoSuave} fontSize={10} textAnchor="middle">
          O
        </SvgText>
        <SvgText x={112} y={64} fill={colores.textoSuave} fontSize={10} textAnchor="middle">
          E
        </SvgText>
        <G rotation={relativo ?? 0} origin="60,60">
          <Line x1={60} y1={60} x2={60} y2={26} stroke={colores.primario} strokeWidth={3} />
          <Polygon points="60,14 68,32 52,32" fill={colores.primario} />
        </G>
        <Circle cx={60} cy={60} r={4} fill={colores.texto} />
      </Svg>
      <View style={styles.textos}>
        <Text style={styles.nombre} numberOfLines={1}>
          {nombre ?? "Sin lugar seleccionado"}
        </Text>
        <Text style={styles.distancia}>
          {distancia === null ? "—" : formatearDistancia(distancia)}
        </Text>
        <Text style={styles.ayuda}>
          {relativo === null ? "Norte arriba" : `${Math.round(relativo)}° desde arriba`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    color: colores.texto,
    fontSize: 15,
    fontWeight: "700",
  },
  distancia: {
    color: colores.primario,
    fontSize: 20,
    fontWeight: "800",
  },
  ayuda: {
    color: colores.textoSuave,
    fontSize: 12,
  },
});
