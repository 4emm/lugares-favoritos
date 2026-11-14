# 22 · Lugares favoritos con radar y brújula

> **Repositorios:** `22-lugares-favoritos-app` y `22-lugares-favoritos-api`

**En una frase:** Guarda lugares con ubicación y fotos; un radar dibujado con vistas y una brújula te guían hacia ellos sin usar mapas con llave.

---

## 1. Problema y usuario

Persona que quiere recordar sitios (cafés, parques, un parqueadero) y volver a ellos.

Es un proyecto **atómico**: pequeño y con un solo objetivo claro. Cumpla todos los requisitos y criterios de aceptación de este documento antes de agregar funciones extra. Se construye **desde cero**: este documento es el único insumo.

## 2. Arquitectura (dos repositorios)

```text
[ App móvil ]  Expo + React Native + TypeScript + Expo Router
   │  SQLite local (funciona sin conexión)
   │  HTTPS + ID token de Firebase (guardado en expo-secure-store)
   ▼
[ API ]  Next.js (Route Handlers, runtime Node) desplegada en Vercel
   │  Variables de entorno SOLO en Vercel
   ├──────────────▶ [ Firebase ]  Authentication + Firestore (solo vía Admin SDK)
   └──────────────▶ [ Vercel Blob ]  imágenes
```

**Regla de oro:** la app móvil no contiene ninguna credencial. Todo lo secreto (clave privada de Firebase Admin, clave web de Firebase, token de Blob, claves de servicios de terceros) vive únicamente en las variables de entorno del proyecto en Vercel. La app solo conoce la URL pública de la API (`EXPO_PUBLIC_API_URL`) y los tokens de sesión del usuario. Recuerde: todo lo que empiece por `EXPO_PUBLIC_` queda **dentro del APK** y cualquiera puede leerlo.

## 3. Pantallas y rutas (Expo Router)

| Ruta | Contenido |
|---|---|
| `(tabs)/index` | Lugares ordenados por distancia |
| `(tabs)/radar` | Radar con zoom y brújula |
| `lugar/nuevo` | Guardar lugar aquí |
| `lugar/[id]` | Detalle |

```text
app/
├── _layout.tsx            # Stack/Tabs, GestureHandlerRootView, proveedor de sesión
├── (tabs)/index.tsx
├── (tabs)/radar.tsx
├── lugar/nuevo.tsx
├── lugar/[id].tsx
src/
├── db/            # abrir SQLite, migraciones
├── repositories/  # SQL parametrizado
├── services/      # reglas de negocio + sincronización con la API
├── api/           # cliente HTTP (fetch + token + refresh + manejo de errores)
├── sensors/       # hooks: useShake, useHeading, useBarometer…
└── components/    # UI reutilizable y accesible
```

## 4. Gestos (mínimo 2 obligatorios, todos con alternativa por botón)

| Gesto | Uso en la app |
|---|---|
| Pellizco (pinch) | Zoom del radio del radar |
| Arrastre (pan) | Desplazar el centro del radar |
| Pulsación larga en un punto | Abrir el detalle del lugar |
| Rotación con dos dedos | Rotar manualmente el radar si no hay brújula |

Implementar con `react-native-gesture-handler` (`Gesture.Pan`, `Pinch`, `Tap`, `LongPress`, `Fling`) y `react-native-reanimated`. **Accesibilidad:** cada acción hecha con un gesto debe poder hacerse también con un botón con `accessibilityLabel`, porque un lector de pantalla no ejecuta gestos complejos.

## 5. Sensores y capacidades del dispositivo (mínimo 2 obligatorias)

| Capacidad | Uso en la app | Alternativa si no está disponible |
|---|---|---|
| **Principal** · `expo-location` | posición actual (`getCurrentPositionAsync`), seguimiento (`watchPositionAsync`) y rumbo (`watchHeadingAsync`). | Entrada manual o flujo alternativo sin el sensor |
| `Magnetometer` / `watchHeadingAsync` | Orientación del radar y flecha | Norte arriba fijo |
| `Barometer` + altitud GPS | Mostrar altitud del lugar y diferencia con la mía | Solo altitud GPS |
| `expo-location` | Posición, precisión, geocodificación | — |
| `Accelerometer` | Sacudir para recentrar el radar | Botón «Centrar» |

Reglas: (1) llame siempre `isAvailableAsync()` antes de usar un sensor; (2) pida permisos solo cuando el usuario active la función y explique para qué; (3) cancele las suscripciones (`subscription.remove()`) al salir de la pantalla; (4) la app **nunca** debe romperse si el sensor o el permiso no están disponibles. Notas de plataforma: `Barometer.relativeAltitude` solo existe en iOS (en Android calcule la altitud desde `pressure`); `LightSensor` es solo Android; `Pedometer.getStepCountAsync` es solo iOS y `watchStepCount` no entrega datos en segundo plano. Muchos sensores no existen en el emulador: pruebe en un dispositivo físico.

## 6. Requisitos funcionales

- **RF-01** Guardar el lugar actual con nombre, categoría, nota y altitud.
- **RF-02** Lista ordenada por distancia a mi posición.
- **RF-03** Radar: círculo con puntos relativos a mi posición, orientado según la brújula.
- **RF-04** Flecha de brújula hacia el lugar seleccionado y distancia en vivo.
- **RF-05** Zoom del radio (100 m – 10 km).
- **RF-06** Geocodificación inversa para mostrar la dirección.

## 7. Reglas de validación

- Nombre obligatorio; coordenadas válidas.
- Evitar guardar dos lugares a menos de 15 m con el mismo nombre.
- Si la precisión es peor de 50 m, advertir antes de guardar.

## 8. Modelo de datos local (SQLite)

```sql
CREATE TABLE lugar (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'otro', lat REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng REAL NOT NULL CHECK (lng BETWEEN -180 AND 180), altitud_m REAL, nota TEXT, foto_uri TEXT, creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
```

Para sincronizar, agregue a cada tabla de dominio: `remote_id TEXT` (id del documento en Firestore; puede ser el mismo UUID), `updated_at TEXT`, `deleted INTEGER DEFAULT 0` y `pending INTEGER DEFAULT 0`.

## 9. API en Vercel (Next.js + Firebase)

Repositorio aparte: **Next.js (App Router) con Route Handlers** (`app/api/**/route.ts`, `export const runtime = "nodejs"`), `firebase-admin`, `zod` y `vitest`. Despliegue en Vercel.

### 9.1 Autenticación — Firebase Auth mediada por la API

La app **no incluye** `firebaseConfig` ni ninguna clave de Firebase. La API inicia sesión con correo y contraseña llamando a la API REST de Firebase Auth
(`accounts:signUp`, `accounts:signInWithPassword`, `securetoken` para renovar), usando `FIREBASE_WEB_API_KEY` que existe **solo en Vercel**.

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `POST /api/auth/registro` | `{ email, password }` (contraseña ≥ 8) | `201 { token, refreshToken, expiraEnSeg, usuario:{ id, email } }` |
| `POST /api/auth/login` | `{ email, password }` | `200` igual que el registro |
| `POST /api/auth/refresh` | `{ refreshToken }` | `200 { token, refreshToken, expiraEnSeg }` |
| `GET /api/auth/yo` | — (Bearer) | `200 { usuario }` |

- `token` es el **ID token** de Firebase (dura 1 h). Todas las demás rutas exigen `Authorization: Bearer <token>` y la API lo verifica con
  `getAuth().verifyIdToken()` (Admin SDK). El `uid` sale **del token verificado**, nunca del cuerpo ni de la URL.
- La app guarda `token` y `refreshToken` en `expo-secure-store`. Si una petición devuelve 401, llama **una vez** a `/api/auth/refresh` y reintenta; si falla, vuelve al login.
- Errores: correo repetido → 409; credenciales inválidas → 401 con el **mismo mensaje** exista o no el correo; contraseña débil → 400; demasiados intentos → 429.
- Rol `admin`: *custom claim* `rol = "admin"` asignado con el Admin SDK (`setCustomUserClaims`); las rutas de administración responden 403 sin él.

### 9.2 Convenciones de Firestore (aplican a todo el proyecto)

- **Acceso solo desde la API** (Admin SDK). Las reglas de Firestore niegan todo a los clientes: `allow read, write: if false;`.
- Datos privados en `usuarios/{uid}/<recurso>/{id}`; el aislamiento entre usuarios lo da la **ruta**. Datos compartidos en colecciones raíz escritas solo por la API.
- Campos en `snake_case` con los **mismos nombres que las columnas de SQLite**. Fechas como texto ISO 8601 UTC (`2026-11-01T15:04:05.000Z`) o `YYYY-MM-DD`. Dinero en enteros (centavos). Sin `undefined`: use `null`.
- Todo documento privado lleva campos base **puestos por el servidor**: `created_at`, `updated_at` y `deleted_at` (`null` o fecha; borrado lógico).
- El `id` lo genera el cliente (UUID) y es el mismo en SQLite y Firestore: así reintentar una escritura no duplica.
- Un documento pesa máximo 1 MiB; una consulta con filtro de rango en un campo y orden/filtro en otro necesita un **índice compuesto** (`firestore.indexes.json`); en una transacción todas las lecturas van antes de las escrituras.

### 9.3 Sincronización (para cada recurso privado)

| Método y ruta | Comportamiento |
|---|---|
| `GET /api/<recurso>?since=<ISO>` | `200 { items:[{ id, …campos, created_at, updated_at, deleted_at }], servidor_ahora }`. Máx. 500 por llamada: repetir con el último `updated_at` hasta recibir menos de 500. Incluye los borrados lógicos. |
| `PUT /api/<recurso>/<id>` | Crea o reemplaza (idempotente). Valida con Zod y descarta campos no declarados. `200` con el documento. |
| `DELETE /api/<recurso>/<id>` | Borrado lógico (`deleted_at`). `200 { ok: true }`; `404` si no existe. |

Estrategia: la app escribe primero en SQLite (`pending = 1`), un servicio envía los pendientes cuando hay conexión y luego pide `?since=` para traer cambios. Conflictos: **gana la última escritura** (`updated_at` del servidor).
Formato de error siempre `{ "error": "mensaje", "detalles"?: [{ "campo", "mensaje" }] }` con códigos 400/401/403/404/409/413/415/429; los errores internos responden `500 Error interno` sin detalles.

### 9.4 Datos de este proyecto en Firestore

```text
usuarios/{uid}/lugar/{id}
  nombre: string · categoria: string · lat: number · lng: number · altitud_m: number|null · nota: string|null
  publico: boolean · foto_url: string|null

lugares_publicos/{id}                   ← copia escrita SOLO por la API cuando publico = true
  owner_uid · nombre · categoria · lat · lng
```

**Endpoints propios de este proyecto** (además de los de 9.1 y 9.3):

- `GET /api/lugares/cerca?lat=&lng=&radio_m=` — Firestore solo admite rango en **un** campo: consulte `lat` entre [lat−Δ, lat+Δ] y filtre `lng` y la distancia (haversine) en el servidor. Alternativa avanzada: geohash.
- `GET /api/lugares/publicos` — lee `lugares_publicos`.

### 9.5 Imágenes con Vercel Blob (store público)

Las imágenes de este proyecto (fotos de los lugares) se guardan en **Vercel Blob**; la app **nunca** recibe el token de Blob.

| Método y ruta | Comportamiento |
|---|---|
| `POST /api/imagenes` | Cuerpo = bytes de la imagen; `Content-Type: image/jpeg \| image/png \| image/webp`. Guarda en `usuarios/<uid>/<uuid>.<ext>` con `addRandomSuffix` y responde `201 { url, pathname }`. Guarde `url` en el campo del documento. |
| `DELETE /api/imagenes?url=` | Solo imágenes **propias**: si el `pathname` no empieza con `usuarios/<uid>/` → 403. |

- Variable de servidor: `BLOB_READ_WRITE_TOKEN` (la agrega `vercel blob create-store`; bájela con `vercel env pull`).
- Vercel limita el cuerpo de una petición a **4,5 MB**: la app **reduce la foto antes de subirla** con `expo-image-manipulator` (ancho ≤ 1280 px, JPEG calidad ≈ 0,7 → unos 150–300 KB).
- Valide tipo y tamaño en el servidor (415 si no es imagen permitida, 413 si pasa de ~4 MB).
- Con un store **público** la URL es accesible para quien la conozca (el sufijo aleatorio la hace difícil de adivinar). Si algún usuario sube imágenes privadas, use un store privado.
- **Cuotas (plan Hobby, según la documentación de Vercel consultada en noviembre de 2026; verifíquelas):** 1 GB de almacenamiento, 10 000 operaciones simples y **2 000 operaciones avanzadas al mes — cada subida cuenta una**. Si se excede no se cobra, pero se **pierde el acceso a Blob 30 días**. Por eso: reduzca las imágenes, no suba en bucles durante las pruebas y borre las imágenes de prueba.

### 9.6 Seguridad de la API (se evalúa)

- Valide **todo** con Zod; solo se guardan los campos declarados. El cliente nunca decide precios, stock, puntajes, roles ni el `uid`.
- Cada ruta privada verifica el ID token; las de administración verifican además el claim `rol`.
- Variables de entorno de la API: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (en Vercel pegue la clave con `\n` literales y conviértalos a saltos de línea al iniciar), `FIREBASE_WEB_API_KEY`, `BLOB_READ_WRITE_TOKEN` y las propias del proyecto. **Nunca** en Git ni en la app.
- Los errores internos no se devuelven al cliente; no registre contraseñas, tokens ni datos personales en los logs.
- Limite la tasa de intentos de login (p. ej. con el Firewall de Vercel) antes de usar datos reales.

## 10. Criterios de aceptación

1. Dado dos lugares a 200 m y 1 km, entonces la lista los ordena así y el radar los ubica en su rumbo.
2. Dado que giro el teléfono, entonces la flecha rota hacia el lugar.
3. Dado el GPS apagado, entonces se pide activarlo y la lista sigue funcionando con la última posición.

## 11. Pruebas mínimas (Jest + jest-expo + React Native Testing Library)

- Lógica pura: distancia y rumbo (bearing) entre dos puntos.
- Lógica: conversión de coordenadas a posición en el radar.
- Servicio: validación de coordenadas.
- Los sensores se prueban con *mocks*: separe la lógica (función pura) de la lectura del sensor.
- En la API (Vitest): al menos 3 pruebas de rutas — una de autenticación (401 sin token), una de validación (400) y una de autorización (aislamiento entre usuarios o rol). Simule Firebase (`vi.mock`) o use el emulador de Firestore.

## 12. Reto opcional

Compartir un lugar como enlace de mapas estándar (`geo:` / URL).

## 13. Puesta en marcha (resumen)

```bash
# App móvil
npx create-expo-app@latest 22-lugares-favoritos-app
cd 22-lugares-favoritos-app
npx expo install expo-sqlite expo-secure-store react-native-gesture-handler react-native-reanimated expo-location expo-sensors expo-image-picker expo-haptics react-native-svg expo-image-manipulator
# .env (URL pública, NO secreta):  EXPO_PUBLIC_API_URL=https://<su-api>.vercel.app
npx expo start

# API (otro repositorio)
npx create-next-app@latest 22-lugares-favoritos-api --ts --app
cd 22-lugares-favoritos-api
npm i firebase-admin zod @vercel/blob
npm i -D vitest
```

**Servicios a configurar:** (1) proyecto de Firebase con *Authentication → Email/Password* habilitado y *Firestore* en modo producción con reglas que niegan todo; (2) cuenta de servicio (clave privada) y clave de API web; (3) store de Vercel Blob; (4) proyecto en Vercel con las variables de entorno y despliegue (`vercel deploy --prod`); (5) comprobar `GET /api/health` desde el teléfono.

## 14. Configuración de la IA del proyecto (reto adicional)

Antes de usar un asistente de IA en este proyecto, el equipo debe **diseñar y configurar su propia configuración de IA**. No se entrega una configuración hecha: pensarla, construirla y comprobarla es parte del reto. Los requisitos detallados y cómo se evalúan se explican en clase (hoja «Configuración de IA»). La configuración queda versionada en el **primer commit** de **cada repositorio** (app y API) y debe cubrir:

- **Reglas del proyecto** para la IA: un archivo de instrucciones propio (stack, comandos, estructura, lo que sí y lo que no).
- **Restricciones de seguridad:** la IA **no puede leer** `.env`, claves ni credenciales, **no puede salir de la carpeta** del proyecto y las acciones con efecto fuera de su máquina piden permiso.
- **Reglas de calidad del código** que se comprueban de forma automática, también sobre el código que escriba la IA.
- **Evidencia:** pruebas propias que demuestren que las restricciones funcionan, guardadas en la carpeta `ia/`, y la bitácora de IA.

Todo debe poder **demostrarse en vivo** en la sustentación.

## 15. Entregables y evaluación

| Hito | Semana | Peso | Entrega para este proyecto |
|---|---|---|---|
| 1 | 4 | 15 % | Interfaz navegable, formularios validados, **gestos** y **un sensor** funcionando (con alternativa). **Configuración de IA (sección 14) en el primer commit de cada repositorio.** |
| 2 | 7 | 15 % | SQLite: modelo, migración, CRUD, búsqueda, funcionamiento sin conexión |
| 3 | 12 | 15 % | API en Vercel (Next.js + Firebase Auth/Firestore), login con renovación de token, sincronización, **segundo sensor** |
| 4 | 15 | 15 % | Pruebas, accesibilidad, seguridad, **APK generado con EAS Build**, bitácora de IA. **Evidencias de la configuración de IA (sección 14)** demostradas en vivo. |

**Cada equipo entrega:** (1) repositorio de la app, (2) repositorio de la API, (3) URL de la API desplegada, (4) enlace de descarga del APK (EAS) o el archivo, (5) `README` con instrucciones y capturas, (6) bitácora de IA (propósito, evidencia, validación, decisión) y carpeta `ia/` con las evidencias de la configuración de IA (sección 14), (7) historial Git con commits de ambos integrantes.

**Lista de verificación de seguridad:**

- [ ] Ningún secreto en el repositorio de la app ni en el APK (busque con `grep -r` y revise el bundle antes de entregar). La app **no** contiene `firebaseConfig`.
- [ ] `.env*` en `.gitignore`; `FIREBASE_PRIVATE_KEY`, `FIREBASE_WEB_API_KEY`, `BLOB_READ_WRITE_TOKEN` solo en Vercel.
- [ ] Reglas de Firestore: `allow read, write: if false`.
- [ ] Tokens en `expo-secure-store`, nunca en `AsyncStorage`.
- [ ] HTTPS en todas las llamadas; sin `localhost` en el APK.
- [ ] Permisos mínimos declarados en `app.json`.
- [ ] Configuración de IA propia en app y API (sección 14): la IA no lee `.env*`, keystores ni claves y no sale de la carpeta del repositorio; evidencias en `ia/`.
