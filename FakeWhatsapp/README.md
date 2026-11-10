# FakeWhatsapp

Demo sencilla de mensajería para Android, escrita en Java y dirigida a Android Oreo (targetSdk 27). Se compila con SDK 36, que puede generar APK para ejecutarse desde Android 5.0 (API 21) en adelante.

## Funciones

- Lista de conversaciones y mensajes de ejemplo.
- Envío de mensajes dentro de una conversación.
- Doble palomita azul en mensajes enviados marcados como leídos en la demo.
- Creación de chats con contactos de ejemplo.
- Pestañas de chats, estados y llamadas.
- Guardado local de conversaciones con `SharedPreferences`.

No requiere Supabase, servidor, cuenta ni conexión a internet. Los mensajes y su estado de lectura se guardan en el dispositivo o emulador donde se ejecuta; la confirmación se simula localmente.

## Abrir en Android Studio

1. Instala Android SDK Platform 36 desde **Tools > SDK Manager > SDK Platforms**.
2. Abre la carpeta `FakeWhatsapp` como proyecto en Android Studio.
3. Espera a que Gradle termine la sincronización.
4. Selecciona un emulador o dispositivo con Android 8.1 (API 27) o posterior y pulsa **Run**.

La app no usa Kotlin ni dependencias externas. Las vistas se crean desde Java; los archivos XML se limitan al manifiesto y al tema de Android.
