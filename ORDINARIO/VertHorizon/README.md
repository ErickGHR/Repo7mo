# Actividad 2: VertHorizon — Ciclo de vida de una Activity

Aplicación Android nativa en Java para observar el ciclo de vida de una Activity, capturar texto en un `EditText` y conservarlo al rotar el dispositivo.

## Abrir y ejecutar

1. Abre Android Studio y selecciona **File → Open**.
2. Abre la carpeta `VertHorizon`.
3. Espera a que termine la sincronización de Gradle.
4. Selecciona un emulador o dispositivo y pulsa **Run ▶**.

## Probar la actividad

1. Escribe algo en el campo de texto.
2. Pulsa **Mostrar dato**.
3. Rota el emulador. La Activity se destruye y se crea de nuevo, pero el texto y el resultado se restauran desde `savedInstanceState`.
4. Para observar los callbacks, abre **View → Tool Windows → Logcat** y filtra por `CicloVidaActivity`.

## Ciclo de vida observado

- `onCreate()`: crea la Activity y carga su interfaz.
- `onStart()`: la Activity se vuelve visible.
- `onResume()`: pasa al primer plano y queda lista para la interacción.
- `onPause()`: pierde el primer plano; pausa operaciones que no deben continuar activas.
- `onStop()`: deja de ser visible.
- `onRestart()`: se ejecuta al volver desde el estado detenido.
- `onDestroy()`: la instancia se destruye, por ejemplo, durante una rotación.
- `onSaveInstanceState()`: guarda datos breves de la interfaz para restaurarlos después de recrear la Activity.

## ¿Qué ocurre con los datos al rotar?

Android normalmente destruye y vuelve a crear la Activity por el cambio de configuración. Las variables que pertenecían a la instancia anterior se pierden. Android puede restaurar automáticamente el texto de un `EditText` con ID, pero los demás datos de la pantalla deben guardarse explícitamente si se desea conservarlos.

En este ejemplo se guardan el texto capturado y el resultado en el `Bundle` de `onSaveInstanceState()` y se restauran en `onCreate()`. Para estado más complejo o que deba sobrevivir a más eventos, se puede usar un `ViewModel`.
