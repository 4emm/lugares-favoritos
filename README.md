# Lugares favoritos

App móvil para guardar lugares con ubicación y fotos, y encontrarlos con una lista ordenada por distancia y un radar con brújula. Los datos se guardan primero en SQLite y funcionan sin conexión. La sincronización requiere una URL de API.

## Descargar y probar con Expo Go

1. Instala **Node.js LTS** y **Expo Go** en el teléfono.
2. Clona el repositorio y entra en la carpeta de la app:

   ```powershell
   git clone https://github.com/4emm/lugares-favoritos.git
   cd lugares-favoritos
   npm ci
   ```

3. Crea tu archivo local de configuración a partir de la plantilla (no se sobrescribe si ya existe):

   ```powershell
   if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
   ```

   `EXPO_PUBLIC_API_URL` debe apuntar a la API desplegada. La plantilla del repositorio ya trae la URL pública del proyecto; si cambia, edita `.env.local`. Expo no carga `.env.example` automáticamente.

4. Para probar primero en la red Wi-Fi local, conecta el computador y el teléfono a la misma red y ejecuta:

   ```powershell
   npm run start -- --lan --go
   ```

   Escanea el QR recién mostrado y deja la terminal abierta. En iPhone, permite **Red local** a Expo Go en Ajustes.

Si el QR local da timeout, detén Expo con `Ctrl+C` y usa el túnel:

```powershell
npm run start:tunnel
```

Escanea el nuevo QR o abre el enlace que muestra esa ejecución. El túnel requiere internet; para evitar el error de cuenta de Expo, inicia sesión con la misma cuenta en Expo CLI y en Expo Go. Los QR y enlaces son temporales: no reutilices uno de una ejecución anterior.

Para iniciar sesión y sincronizar hace falta que la API esté desplegada y disponible. La app puede usarse localmente para guardar y consultar lugares sin iniciar sesión. No pongas contraseñas, claves privadas, claves de Firebase ni tokens en variables `EXPO_PUBLIC_`: Expo las incluye en el bundle. La API y sus secretos se configuran por separado en Vercel.

## Probar en web

Con `.env.local` creado, ejecuta `npm run web` y abre la dirección local que imprima Expo. Si aparece “falta configurar Expo public API”, la variable no se cargó: verifica que `.env.local` esté en la raíz del proyecto y reinicia el servidor. La versión web es solo una previsualización: usa una base SQLite en memoria y una sesión temporal. Para probar persistencia, SecureStore y sensores, usa Expo Go en el teléfono.

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
