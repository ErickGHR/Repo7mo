# MongoDBConexion

Aplicación Expo / React Native para explorar las películas de `Servidor`.
Incluye una hoja de estilos en `styles.js`, tarjetas con póster, carga, estado vacío
y mensajes de error con reintento.

## Ejecutar

Requiere Node.js 22.13 o superior. Primero configura e inicia `../Servidor`.
Desde esta carpeta:

```powershell
npm install
npm start
```

Abre el QR con una versión de Expo Go compatible con SDK 57. El celular y la
computadora deben estar en la misma red. En Expo Go se detecta automáticamente
la dirección de la computadora que ejecuta Metro y se usa el puerto 3000.

Para el navegador:

```powershell
npm run web
```

## Dirección del servidor

Para otro puerto, un servidor remoto, un túnel de Expo o una compilación instalada,
copia `.env.example` a `.env` y configura la URL de la API:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

Sustituye la IP por la de tu computadora (`ipconfig`). En un celular físico,
`localhost` se refiere al propio celular. El emulador Android usa `10.0.2.2` para
acceder a su computadora anfitriona. Recarga la app después de cambiar `.env`.
Para una compilación de distribución usa una API HTTPS.

La contraseña de MongoDB pertenece únicamente al `.env` de `Servidor`.

## Comprobaciones

```powershell
npm run lint
npm run typecheck
npx expo-doctor
npx expo export --platform all
```

La app muestra hasta 100 películas, según el límite de la API.
