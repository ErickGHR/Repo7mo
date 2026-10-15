# Actividad 1: Fragmentos en Android

Aplicación Android nativa escrita completamente en Java, con una sola actividad, tres botones y tres fragmentos: Inicio, Perfil y Ayuda.

## Abrir y ejecutar

1. Abre Android Studio.
2. Selecciona **Open** y elige esta carpeta `FragmentosAndroid`.
3. Espera a que termine la sincronización de Gradle.
4. Ejecuta la app en un emulador o dispositivo Android.

También puedes compilarla desde una terminal de Windows con `gradlew.bat assembleDebug`.

## Estructura

- `MainActivity.java`: contiene los tres botones y usa `FragmentManager` para reemplazar el fragmento del contenedor.
- `InicioFragment.java`, `PerfilFragment.java`, `AyudaFragment.java`: clases de los tres fragmentos.
- `res/layout/activity_main.xml`: interfaz de la actividad.
- `res/layout/fragment_*.xml`: interfaz individual de cada fragmento.

La transacción no se agrega a la pila de retroceso, por lo que los botones permiten cambiar entre secciones sin guardar cada selección como un paso de navegación.
