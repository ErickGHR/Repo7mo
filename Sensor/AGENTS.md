# Pulso Sensor Lab

Aplicación nativa de Android escrita en Java. El módulo Android Studio está en android/; no usa Expo, React Native, Kotlin ni dependencias de Node para compilar.

## Ejecutar

1. Abre la carpeta Sensor/android en Android Studio.
2. Espera a que termine Gradle Sync.
3. Selecciona el emulador o conecta un teléfono Android y pulsa Run en el módulo app.

El proyecto usa Java 17, Android Gradle Plugin 8.13.2, Gradle 8.13, compileSdk 36 y minSdk 24.

## Pantallas

- MainActivity: inicio y acceso a las demostraciones.
- AccelerometerActivity: aceleración X/Y/Z expresada en múltiplos de g.
- GyroscopeActivity: velocidad angular X/Y/Z en radianes por segundo.
- GpsActivity: ubicación de primer plano; solicita permiso al pulsar Actualizar.
- MagnetometerActivity: campo magnético y rumbo de brújula compensado con gravedad.
- ResearchActivity: guía introductoria de los sensores.
- SplashActivity: pantalla de entrada nativa de Android.

Las suscripciones de sensores se liberan al pausar cada pantalla. La ubicación no se solicita en segundo plano. En el emulador se pueden enviar coordenadas desde Extended Controls > Location; acelerómetro y giroscopio pueden requerir un dispositivo físico o lecturas simuladas.
