import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";

export const ANCHO_MAXIMO = 1280;
export const CALIDAD_JPEG = 0.7;

export type ImagenPreparada = {
  uri: string;
  contentType: "image/jpeg";
  bytes: ArrayBuffer;
};

function dimensiones(uri: string): Promise<{ ancho: number }> {
  return new Promise((resolver, rechazar) => {
    Image.getSize(
      uri,
      (ancho) => resolver({ ancho }),
      (error) => rechazar(error),
    );
  });
}

/**
 * Reduce la foto a un ancho máximo de 1280 px y JPEG ~0,7 antes de subirla:
 * Vercel limita el cuerpo a 4,5 MB (sección 9.5 del proyecto).
 */
export async function prepararImagen(uri: string): Promise<ImagenPreparada> {
  const { ancho } = await dimensiones(uri);
  const contexto = ImageManipulator.manipulate(uri);
  if (ancho > ANCHO_MAXIMO) {
    contexto.resize({ width: ANCHO_MAXIMO });
  }
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({ compress: CALIDAD_JPEG, format: SaveFormat.JPEG });
  const respuesta = await fetch(resultado.uri);
  const bytes = await respuesta.arrayBuffer();
  return { uri: resultado.uri, contentType: "image/jpeg", bytes };
}
