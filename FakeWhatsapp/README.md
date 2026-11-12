# FakeWhatsapp

Demo de mensajería Android nativa, escrita en Java y dirigida a Android Oreo (`targetSdk 27`). Se compila con SDK 36 y funciona desde Android 5.0 (`minSdk 21`). No usa Kotlin. El proyecto incluye una API opcional de Supabase y notificaciones FCM; la demo local también funciona sin conectarlas.

## Incluye

- Lista de chats, mensajes, estados y llamadas de ejemplo.
- Envío local de mensajes y confirmaciones de lectura con doble palomita azul.
- Creación de conversaciones grupales con contactos de ejemplo.
- Fotos de perfil elegidas desde la galería y adjuntos de imagen en mensajes.
- Búsqueda de texto en los mensajes de todos los chats o del chat abierto.
- Eliminación lógica de mensajes propios con pulsación larga.
- Chats y estado guardados en `SharedPreferences`.
- Registro e inicio de sesión de Supabase desde el menú **Cuenta / API Supabase**.
- Registro y baja del token FCM al iniciar y cerrar sesión.
- Canal Android de notificaciones y apertura del chat indicado al tocar una notificación.
- Migración Supabase con perfiles, dispositivos, chats directos y grupales, mensajes de texto e imagen, recibos de lectura, almacenamiento privado, búsqueda y RLS.
- Edge Function de Supabase que envía notificaciones con FCM HTTP v1 sin exponer la clave privada en el teléfono.

Los chats de muestra, grupos, fotos y mensajes de esta demo se guardan en el dispositivo. El cliente se conecta a Supabase para autenticación y registro del token FCM cuando se configura; las operaciones de chat en la interfaz todavía no se sincronizan con las tablas remotas. La migración deja el esquema y las operaciones REST para esa API. El repo no contiene credenciales reales de Supabase o Firebase.

## Abrir y compilar

1. Instala Android SDK Platform 36 desde **Tools > SDK Manager > SDK Platforms**.
2. Abre la carpeta `FakeWhatsapp` en Android Studio y espera la sincronización de Gradle.
3. Para probar el modo local, ejecuta **Run** en un dispositivo o emulador.
4. Para conectar la API, sigue [`supabase/README.md`](supabase/README.md), agrega la URL y la clave pública de Supabase a `local.properties` y sincroniza Gradle.
5. Para FCM, registra `com.example.fakewhatsapp` en Firebase y coloca su `google-services.json` en `app/`. Ese archivo se ignora en Git porque depende de tu proyecto.

Para generar el APK de depuración, ejecuta `gradlew.bat assembleDebug`. El archivo queda en `app/build/outputs/apk/debug/app-debug.apk`; puedes copiarlo al teléfono e instalarlo. Esta app nativa Java no se ejecuta dentro de Expo Go.

La función Edge de Supabase está en TypeScript porque ese es el entorno de ejecución de Supabase; todo el código del cliente Android es Java. Las credenciales privadas de Firebase/FCM se configuran únicamente como secretos del servidor.
