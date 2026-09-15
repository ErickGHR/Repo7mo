import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";

import {
  Gyroscope,
  Accelerometer,
} from "expo-sensors";

const TAMANO_PELOTA = 45;
const RADIO = TAMANO_PELOTA / 2;

const COLORES = [
  "#E53935",
  "#1E88E5",
  "#43A047",
  "#FDD835",
  "#8E24AA",
];

export default function GyroscopeSensor() {
  const [datos, setDatos] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const inclinacion = useRef({
    x: 0,
    y: 0,
    z: 0,
  });

  const pantalla = useRef({
    width: 0,
    height: 0,
  });

  const iniciado = useRef(false);

  const pelotas = useRef(
    COLORES.map((color) => ({
      color: color,

      x: 0,
      y: 0,

      vx: 0,
      vy: 0,

      posicion: new Animated.ValueXY({
        x: 0,
        y: 0,
      }),
    }))
  ).current;

  useEffect(() => {
    Gyroscope.setUpdateInterval(100);

    const gyroscopeSubscription =
      Gyroscope.addListener((measurements) => {
        setDatos(measurements);
      });

    Accelerometer.setUpdateInterval(50);

    const accelerometerSubscription =
      Accelerometer.addListener((measurements) => {
        inclinacion.current = measurements;
      });

    return () => {
      gyroscopeSubscription.remove();
      accelerometerSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let animationFrame;
    let tiempoAnterior = Date.now();

    const animar = () => {
      const tiempoActual = Date.now();

      let deltaTime =
        (tiempoActual - tiempoAnterior) / 1000;

      tiempoAnterior = tiempoActual;

      if (deltaTime > 0.03) {
        deltaTime = 0.03;
      }

      const ancho = pantalla.current.width;
      const alto = pantalla.current.height;

      if (ancho > 0 && alto > 0) {
        const fuerza = 1300;

        const aceleracionX =
          inclinacion.current.x * fuerza;

        const aceleracionY =
          -inclinacion.current.y * fuerza;

        // --------------------------
        // MOVIMIENTO DE LAS PELOTAS
        // --------------------------

        pelotas.forEach((pelota) => {
          pelota.vx +=
            aceleracionX * deltaTime;

          pelota.vy +=
            aceleracionY * deltaTime;

          // Fricción
          pelota.vx *= 0.995;
          pelota.vy *= 0.995;

          // Evita velocidades absurdamente altas
          const velocidadMaxima = 1300;

          pelota.vx = Math.max(
            -velocidadMaxima,
            Math.min(velocidadMaxima, pelota.vx)
          );

          pelota.vy = Math.max(
            -velocidadMaxima,
            Math.min(velocidadMaxima, pelota.vy)
          );

          pelota.x +=
            pelota.vx * deltaTime;

          pelota.y +=
            pelota.vy * deltaTime;

          // --------------------------
          // REBOTE CONTRA LAS PAREDES
          // --------------------------

          if (pelota.x < 0) {
            pelota.x = 0;
            pelota.vx *= -0.75;
          }

          if (
            pelota.x >
            ancho - TAMANO_PELOTA
          ) {
            pelota.x =
              ancho - TAMANO_PELOTA;

            pelota.vx *= -0.75;
          }

          if (pelota.y < 0) {
            pelota.y = 0;
            pelota.vy *= -0.75;
          }

          if (
            pelota.y >
            alto - TAMANO_PELOTA
          ) {
            pelota.y =
              alto - TAMANO_PELOTA;

            pelota.vy *= -0.75;
          }
        });

        // --------------------------
        // COLISIONES ENTRE PELOTAS
        // --------------------------

        for (
          let i = 0;
          i < pelotas.length;
          i++
        ) {
          for (
            let j = i + 1;
            j < pelotas.length;
            j++
          ) {
            const pelotaA = pelotas[i];
            const pelotaB = pelotas[j];

            const centroAX =
              pelotaA.x + RADIO;

            const centroAY =
              pelotaA.y + RADIO;

            const centroBX =
              pelotaB.x + RADIO;

            const centroBY =
              pelotaB.y + RADIO;

            const dx =
              centroBX - centroAX;

            const dy =
              centroBY - centroAY;

            const distancia =
              Math.sqrt(
                dx * dx +
                dy * dy
              );

            if (
              distancia <
                TAMANO_PELOTA &&
              distancia > 0
            ) {
              // Dirección de la colisión
              const normalX =
                dx / distancia;

              const normalY =
                dy / distancia;

              // --------------------------
              // SEPARAR PELOTAS
              // --------------------------

              const superposicion =
                TAMANO_PELOTA -
                distancia;

              pelotaA.x -=
                normalX *
                superposicion /
                2;

              pelotaA.y -=
                normalY *
                superposicion /
                2;

              pelotaB.x +=
                normalX *
                superposicion /
                2;

              pelotaB.y +=
                normalY *
                superposicion /
                2;

              // --------------------------
              // VELOCIDAD RELATIVA
              // --------------------------

              const velocidadRelativaX =
                pelotaB.vx -
                pelotaA.vx;

              const velocidadRelativaY =
                pelotaB.vy -
                pelotaA.vy;

              const velocidadNormal =
                velocidadRelativaX *
                  normalX +
                velocidadRelativaY *
                  normalY;

              // Solo rebotar si se acercan
              if (
                velocidadNormal < 0
              ) {
                const rebote = 0.85;

                const impulso =
                  -(
                    1 + rebote
                  ) *
                  velocidadNormal /
                  2;

                pelotaA.vx -=
                  impulso *
                  normalX;

                pelotaA.vy -=
                  impulso *
                  normalY;

                pelotaB.vx +=
                  impulso *
                  normalX;

                pelotaB.vy +=
                  impulso *
                  normalY;
              }
            }
          }
        }

        // --------------------------
        // ACTUALIZAR POSICIÓN VISUAL
        // --------------------------

        pelotas.forEach((pelota) => {
          pelota.posicion.setValue({
            x: pelota.x,
            y: pelota.y,
          });
        });
      }

      animationFrame =
        requestAnimationFrame(animar);
    };

    animationFrame =
      requestAnimationFrame(animar);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, []);

  const obtenerTamanoPantalla = (
    event
  ) => {
    const {
      width,
      height,
    } = event.nativeEvent.layout;

    pantalla.current = {
      width,
      height,
    };

    if (!iniciado.current) {
      const centroX =
        width / 2;

      const centroY =
        height / 2;

      const posicionesIniciales = [
        {
          x: centroX - 100,
          y: centroY - 100,
        },
        {
          x: centroX + 50,
          y: centroY - 100,
        },
        {
          x: centroX - 100,
          y: centroY + 50,
        },
        {
          x: centroX + 50,
          y: centroY + 50,
        },
        {
          x: centroX - 25,
          y: centroY - 25,
        },
      ];

      pelotas.forEach(
        (pelota, index) => {
          pelota.x =
            posicionesIniciales[
              index
            ].x;

          pelota.y =
            posicionesIniciales[
              index
            ].y;

          // Pequeña velocidad inicial
          pelota.vx =
            Math.random() * 100 -
            50;

          pelota.vy =
            Math.random() * 100 -
            50;

          pelota.posicion.setValue({
            x: pelota.x,
            y: pelota.y,
          });
        }
      );

      iniciado.current = true;
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={
        obtenerTamanoPantalla
      }
    >
      <View style={styles.informacion}>
        <Text style={styles.title}>
          Giroscopio
        </Text>

        <View style={styles.card}>
          <Text style={styles.axis}>
            X
          </Text>

          <Text style={styles.value}>
            {datos.x.toFixed(2)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.axis}>
            Y
          </Text>

          <Text style={styles.value}>
            {datos.y.toFixed(2)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.axis}>
            Z
          </Text>

          <Text style={styles.value}>
            {datos.z.toFixed(2)}
          </Text>
        </View>
      </View>

      {pelotas.map(
        (pelota, index) => (
          <Animated.View
            key={index}
            style={[
              styles.pelota,
              {
                backgroundColor:
                  pelota.color,

                transform:
                  pelota.posicion
                    .getTranslateTransform(),
              },
            ]}
          />
        )
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      backgroundColor: "#f5f5f5",
      overflow: "hidden",
    },

    informacion: {
      position: "absolute",
      top: 60,
      width: "100%",
      alignItems: "center",
      zIndex: 10,
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
    },

    card: {
      backgroundColor: "#fff",
      padding: 15,
      marginBottom: 10,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent:
        "space-between",
      width: 200,
    },

    axis: {
      fontSize: 18,
      fontWeight: "bold",
    },

    value: {
      fontSize: 18,
      fontWeight: "bold",
    },

    pelota: {
      position: "absolute",
      top: 0,
      left: 0,
      width: TAMANO_PELOTA,
      height: TAMANO_PELOTA,
      borderRadius:
        TAMANO_PELOTA / 2,
    },
  });