import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Accelerometer } from "expo-sensors";

export default function AccelerometerSensor() {
  const [datos, setDatos] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const colores = ["#006847", "#FFFFFF", "#CE1126"];
  const [colorActual, setColorActual] = useState(0);

  const ultimaSacudida = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((measurements) => {
      setDatos(measurements);

      const { x, y, z } = measurements;

      const fuerza = Math.sqrt(
        x * x +
        y * y +
        z * z
      );

      const tiempoActual = Date.now();

      if (
        fuerza > 1.8 &&
        tiempoActual - ultimaSacudida.current > 700
      ) {
        ultimaSacudida.current = tiempoActual;

        setColorActual((anterior) => {
          return (anterior + 1) % colores.length;
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colores[colorActual] },
      ]}
    >
      <Text style={styles.title}>
        Acelerómetro
      </Text>

      <View style={styles.card}>
        <Text style={styles.axis}>X</Text>
        <Text style={styles.value}>
          {datos.x.toFixed(2)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.axis}>Y</Text>
        <Text style={styles.value}>
          {datos.y.toFixed(2)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.axis}>Z</Text>
        <Text style={styles.value}>
          {datos.z.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
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
    justifyContent: "space-between",
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
});