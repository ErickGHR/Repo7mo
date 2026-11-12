# FakeWhatsapp API (Supabase + FCM)

Esta API implementa los datos y reglas de seguridad para perfiles, dispositivos, chats directos/grupales, mensajes, confirmaciones de lectura, fotos e imágenes. El cliente Android sigue siendo una aplicación nativa escrita en Java.

## Crear y configurar tu proyecto Supabase

El proyecto `FakeWhatsapp` está creado en `ErickGHR's Org`, región East US (North Virginia), con referencia `ucnddgwewgmclnodozna` y URL `https://ucnddgwewgmclnodozna.supabase.co`.

La migración `migrations/20261111000000_fakewhatsapp_api.sql` ya se ejecutó desde **SQL Editor**. Verifiqué las tablas `profiles`, `push_devices`, `conversations`, `conversation_members` y `messages`, todas con RLS habilitado, además de los buckets privados `profile-photos` y `message-images`.

En **Authentication > Sign In / Providers**, Email está habilitado, se permiten registros y se requiere confirmar el correo. El APK ya tiene la URL y la clave pública `sb_publishable_...` en `FakeWhatsapp/local.properties`; ese archivo está ignorado por Git. Las claves `sb_publishable_...` son para el cliente y nunca deben sustituirse por `sb_secret_...` ni `service_role`.

La migración se ejecutó manualmente desde Dashboard. No ejecutes `supabase db push` para volver a aplicar esta migración hasta sincronizar el historial local. El CLI no hace falta para completar la configuración pendiente de FCM.

Las tablas tienen RLS habilitado. La membresía de la conversación determina qué perfiles, participantes, mensajes e imágenes puede consultar una cuenta. La clave `service_role` y la clave privada de Firebase nunca se colocan en Android.

## Configurar FCM y el webhook

1. Registra `com.example.fakewhatsapp` como aplicación Android en Firebase y descarga `google-services.json` en `FakeWhatsapp/app/`. Ese archivo está ignorado por Git.
2. Crea una cuenta de servicio de Firebase con permiso **Firebase Cloud Messaging API Admin** y habilita Firebase Cloud Messaging API. Obtén `project_id`, `client_email` y `private_key` de Firebase.
3. En **Supabase > Edge Functions > Secrets**, ingresa directamente en el Dashboard `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL` y `FCM_PRIVATE_KEY`. Genera un valor aleatorio largo para `FAKEWHATSAPP_WEBHOOK_SECRET` y guárdalo allí también. No compartas la clave privada ni el secreto en el chat o el repositorio.
4. La URL del proyecto ya está guardada en Vault como `fakewhatsapp_project_url`. Falta guardar allí el mismo valor de `FAKEWHATSAPP_WEBHOOK_SECRET`. En **SQL Editor**, sustituye el marcador directamente por ese secreto y ejecuta:

   ```sql
   select vault.create_secret('PEGA_AQUI_EL_MISMO_SECRETO_DEL_WEBHOOK', 'fakewhatsapp_webhook_secret');
   ```

5. `send-message-notification` ya está desplegada y **Verify JWT with legacy secret** está desactivado para que el trigger de PostgreSQL pueda llamarla. El código exige el encabezado `X-Webhook-Secret`. Al guardar los secretos, cada mensaje insertado podrá generar una notificación FCM.

El trigger de la migración invoca la función al insertar un mensaje. Esta función busca los tokens de los miembros destinatarios y envía notificaciones con FCM HTTP v1. Al tocar la notificación, Android abre la conversación indicada en el `data payload`.

## API incluida

- `POST /rest/v1/rpc/create_conversation`: crea o recupera chat directo; también crea grupos.
- `POST /rest/v1/rpc/register_push_device`: guarda el token FCM autenticado del dispositivo.
- `POST /rest/v1/rpc/unregister_push_device`: elimina el token al cerrar sesión.
- `POST /rest/v1/rpc/mark_conversation_read`: marca mensajes entrantes como leídos.
- `POST /rest/v1/rpc/delete_message`: elimina lógicamente mensajes propios.
- `POST /rest/v1/messages`: agrega mensajes de texto o imagen a una conversación en la que participa el usuario.
- `GET /rest/v1/messages?conversation_id=eq.<uuid>&body=ilike.*texto*`: busca dentro de mensajes accesibles por RLS.
- `POST /storage/v1/object/profile-photos/...` y `POST /storage/v1/object/message-images/...`: almacena medios en buckets privados, con políticas por usuario y membresía.

La URL y la clave pública ya están configuradas en `FakeWhatsapp/local.properties`. Cuando agregues Firebase, coloca `google-services.json` en `FakeWhatsapp/app/` y recompila.

Los RPC requieren un JWT de Supabase Auth. En esta versión, la interfaz Android aún guarda las conversaciones, grupos, fotos y mensajes de ejemplo localmente; el login Supabase y el token FCM sí se conectan. Después de desplegar, la API queda lista para que clientes autenticados creen grupos, suban fotos a los buckets privados, inserten/busquen mensajes, marquen lecturas y eliminen mensajes propios. El APK conserva `targetSdk 27`; el FCM SDK elegido también conserva la compatibilidad con `minSdk 21`.
