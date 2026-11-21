# Lugares favoritos

App móvil para guardar lugares con ubicación y fotos, y encontrarlos con una lista ordenada por distancia y un radar con brújula. Los datos se guardan primero en SQLite y funcionan sin conexión. La sincronización requiere una URL de API.

## Probar en un teléfono con Expo Go

1. Instala **Expo Go** en el teléfono y conecta el teléfono y el computador a la misma red Wi-Fi.
2. Desde esta carpeta, instala dependencias si todavía no están instaladas:

   ```powershell
   npm install
   ```

3. Inicia Expo en la red local:

   ```powershell
   npm run start -- --lan --go
   ```

4. Escanea el QR con Expo Go (Android) o con la cámara del teléfono (iPhone). Deja la terminal abierta mientras usas la app.

Si el QR local da timeout, comprueba que Expo Go tenga permiso de **Red local** en Ajustes del iPhone. Si el router o firewall bloquea la conexión entre dispositivos, inicia el túnel con `npm run start:tunnel` y escanea el nuevo QR; el teléfono solo necesita acceso a internet y puede estar en otra red. Detén el servidor anterior con `Ctrl+C` antes de cambiar de modo.

La primera pantalla y las funciones locales se pueden probar sin API: crea lugares, busca, mira el radar y prueba ubicación, brújula y gestos. Para iniciar sesión y sincronizar, configura la URL HTTPS de la API en `.env`:

```dotenv
EXPO_PUBLIC_API_URL=https://<tu-api>.vercel.app
```

`.env.example` contiene solo esta variable pública de referencia. No pongas contraseñas, claves privadas, claves de Firebase ni tokens en variables `EXPO_PUBLIC_`: Expo las incluye en el bundle. Después de cambiar `.env`, reinicia Expo para que tome el nuevo valor. La API y sus secretos se configuran por separado en Vercel.

La versión web es solo una previsualización: usa una base SQLite en memoria y una sesión temporal. Para probar persistencia, SecureStore y sensores, usa Expo Go en el teléfono.

## Comandos

```powershell
npm run start -- --lan --go  # Expo Go en la red local
npm run start:tunnel         # Expo Go mediante túnel si la red local bloquea el QR
npm run android              # Abrir en emulador Android
npm run typecheck            # Comprobar TypeScript
npm run lint                 # ESLint
npm run check                # TypeScript, ESLint, formato y pruebas
npm run ia:verificar         # Revisar la configuración de IA
```

## Estructura

- `app/`: rutas de Expo Router (lugares, radar, formulario y cuenta).
- `src/db/` y `src/repositories/`: SQLite local y acceso parametrizado.
- `src/services/`: reglas de negocio, geometría y sincronización.
- `src/api/`: cliente HTTP, sesión segura y endpoints de la API.
- `src/sensors/`: ubicación, rumbo y sacudida; cada función tiene alternativa de interfaz.
- `tests/`: pruebas de lógica y servicios con sensores y dependencias nativas aislados.
- `ia/`: reglas, evidencia y bitácora de IA.

## Privacidad y permisos

La app no integra el SDK de Firebase ni contiene credenciales del servidor. Los tokens de sesión se guardan con `expo-secure-store`; los lugares se almacenan localmente en SQLite. Se solicita ubicación al usar las funciones que la necesitan y acceso a fotos cuando se elige una imagen. Revisa [`AGENTS.md`](AGENTS.md) y [`ia/`](ia/) para las reglas y evidencias de trabajo asistido por IA.
