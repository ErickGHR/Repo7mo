# FaceRecognition

Aplicación móvil con Expo SDK 54 para capturar rostros, detectarlos localmente con ML Kit y comparar los puntos faciales de una captura contra un registro guardado en el mismo celular.

## Funciones

- Solicita permiso de cámara cuando se abre el registro o reconocimiento.
- Toma fotos con la cámara frontal y guarda las imágenes de personas registradas dentro del espacio privado de la aplicación.
- Detecta rostros y puntos faciales en el dispositivo; no se envían fotos a un servidor.
- Guarda nombres, fotos y descriptores geométricos en almacenamiento local.
- Compara una captura con las personas registradas y permite eliminar un registro junto con su foto.

## Instalar y ejecutar

Requiere Node.js, Android Studio con un emulador o un dispositivo Android. iOS requiere macOS y Xcode.

```bash
npm install
npx expo prebuild
npx expo run:android
```

Para iOS, ejecuta `npx expo run:ios` en macOS. Después de crear e instalar el cliente nativo, inicia Metro con `npm start` y abre la aplicación FaceRecognition instalada. Los cambios en dependencias o configuración nativa requieren volver a ejecutar prebuild y compilar.

Esta app necesita un cliente nativo propio porque el detector ML Kit incluye código nativo; no se ejecuta en Expo Go. Consulta la [guía de Expo para development builds](https://docs.expo.dev/develop/development-builds/introduction/) y la [guía de ML Kit Face Detection para Expo](https://docs.infinite.red/react-native-mlkit/face-detection/getting-started/).

## Alcance del reconocimiento

ML Kit detecta rostros y sus puntos de referencia; no identifica personas. Para esta práctica, la app compara proporciones normalizadas entre ojos, nariz, boca, mejillas y orejas. Este descriptor geométrico es una demostración educativa, no un modelo biométrico entrenado: los resultados pueden cambiar con el ángulo, la expresión, la iluminación y la calidad de la cámara. No lo uses para autenticación, control de acceso ni decisiones sobre personas.

Las capturas y los registros se guardan de forma local en el almacenamiento privado de la aplicación. Desinstalarla elimina ese almacenamiento.
