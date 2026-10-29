# Pulso Sensor Lab

Aplicación didáctica de sensores para Android, construida con Expo SDK 57 y React Native.

## Preparar y ejecutar

1. Instala Node.js LTS y Android Studio con Android SDK y un emulador configurado, o conecta un teléfono Android con depuración USB.
2. Desde esta carpeta ejecuta `npm install`.
3. Ejecuta `npx expo prebuild --platform android` para generar el proyecto nativo Android.
4. Abre la carpeta `android` en Android Studio, espera a que termine Gradle Sync y pulsa Run.

También puedes ejecutar `npx expo run:android` con un dispositivo/emulador disponible. Para previsualizar con Expo Go usa `npx expo start`; la SplashScreen nativa configurada debe verificarse en una compilación independiente.

## Demos

- **Acelerómetro:** lectura X/Y/Z en múltiplos de g; la gravedad permanece en la medición.
- **Giroscopio:** velocidad angular por eje en radianes por segundo.
- **GPS:** latitud, longitud y precisión; pide permiso de ubicación en primer plano sólo cuando se abre la demo y se toca el botón.
- **Magnetómetro:** campo magnético X/Y/Z en microteslas y rumbo aproximado de brújula.

El menú lateral conecta las pantallas y la guía de investigación. Los sensores de movimiento requieren un dispositivo físico o un emulador que simule sus lecturas; la demo GPS puede usar la ubicación simulada del emulador.

Las suscripciones a sensores sólo viven mientras su pantalla está montada. La ubicación no se recopila en segundo plano.
