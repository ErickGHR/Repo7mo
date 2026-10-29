# Pulso Sensor Lab

Aplicación Android nativa escrita en Java. El proyecto no utiliza Expo, React Native, Kotlin ni dependencias de Node.

## Abrir y ejecutar

1. Abre la carpeta `Sensor/android` con Android Studio.
2. Espera a que Gradle Sync termine.
3. Elige un emulador o teléfono Android, selecciona el módulo `app` y pulsa Run.

Requisitos: Android Studio, JDK 17 y Android SDK 36. El wrapper usa Gradle 8.13 y Android Gradle Plugin 8.13.2.

## Demostraciones

- Acelerómetro: X/Y/Z en múltiplos de g.
- Giroscopio: velocidad angular en radianes por segundo.
- GPS: coordenadas y precisión, con permiso en primer plano.
- Magnetómetro: campo magnético en µT y brújula compensada con gravedad.
- Investigación: explicación de los sensores.

Cada demo es una Activity Android Java separada y todas comparten el menú lateral nativo. En el emulador, la ubicación se configura en Extended Controls > Location. Para acelerómetro y giroscopio se recomienda un teléfono físico o simular las lecturas desde los controles del emulador.
