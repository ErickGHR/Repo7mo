import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pedometer } from "expo-sensors";

export default function PedometerSensor() {
  const [pasos, setPasos] = useState(0);
  const [disponible, setDisponible] = useState(false);
  const [permiso, setPermiso] = useState(false);

  useEffect(() => {
    let subscription;

    const iniciarPedometer = async () => {
      // Comprobar si el celular tiene podómetro
      const estaDisponible =
        await Pedometer.isAvailableAsync();

      setDisponible(estaDisponible);

      if (!estaDisponible) {
        return;
      }

      // Pedir permiso para actividad física
      const resultadoPermiso =
        await Pedometer.requestPermissionsAsync();

      if (resultadoPermiso.status !== "granted") {
        setPermiso(false);
        return;
      }

      setPermiso(true);

      // Contar pasos
      subscription = Pedometer.watchStepCount((resultado) => {
        setPasos(resultado.steps);
      });
    };

    iniciarPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Podómetro
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Sensor
        </Text>

        <Text style={styles.value}>
          {disponible ? "Disponible" : "No disponible"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Permiso
        </Text>

        <Text style={styles.value}>
          {permiso ? "Concedido" : "Sin permiso"}
        </Text>
      </View>

      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>
          Pasos
        </Text>

        <Text style={styles.steps}>
          {pasos}
        </Text>
      </View>

      <Text style={styles.message}>
        Camina con tu celular para registrar pasos
      </Text>
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
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    width: 280,
  },

  label: {
    fontSize: 18,
    fontWeight: "bold",
  },

  value: {
    fontSize: 18,
  },

  stepsCard: {
    width: 280,
    backgroundColor: "#fff",
    padding: 30,
    marginTop: 20,
    borderRadius: 15,
    alignItems: "center",
  },

  stepsTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  steps: {
    fontSize: 60,
    fontWeight: "bold",
    marginTop: 10,
  },

  message: {
    fontSize: 16,
    marginTop: 25,
    textAlign: "center",
  },
}); 