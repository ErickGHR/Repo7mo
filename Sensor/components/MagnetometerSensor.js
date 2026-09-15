import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Magnetometer } from "expo-sensors";

export default function MagnetometerSensor() {
  const [datos, setDatos] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const [grados, setGrados] = useState(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener((measurements) => {
      setDatos(measurements);

      const { x, y } = measurements;

      let angulo = Math.atan2(y, x) * (180 / Math.PI);

      // Ajuste para que la parte superior del celular
      // corresponda con la dirección de la brújula
      angulo += 90;

      if (angulo < 0) {
        angulo += 360;
      }

      if (angulo >= 360) {
        angulo -= 360;
      }

      setGrados(Math.round(angulo));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const obtenerDireccion = (angulo) => {
    if (angulo >= 337.5 || angulo < 22.5) {
      return "N";
    }

    if (angulo >= 22.5 && angulo < 67.5) {
      return "NE";
    }

    if (angulo >= 67.5 && angulo < 112.5) {
      return "E";
    }

    if (angulo >= 112.5 && angulo < 157.5) {
      return "SE";
    }

    if (angulo >= 157.5 && angulo < 202.5) {
      return "S";
    }

    if (angulo >= 202.5 && angulo < 247.5) {
      return "SO";
    }

    if (angulo >= 247.5 && angulo < 292.5) {
      return "O";
    }

    if (angulo >= 292.5 && angulo < 337.5) {
      return "NO";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Magnetómetro</Text>

      <View style={styles.card}>
        <Text style={styles.axis}>X</Text>
        <Text style={styles.value}>{datos.x.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.axis}>Y</Text>
        <Text style={styles.value}>{datos.y.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.axis}>Z</Text>
        <Text style={styles.value}>{datos.z.toFixed(2)}</Text>
      </View>

      <Text style={styles.compassTitle}>Brújula digital</Text>

      <View style={styles.compass}>
        <Text style={[styles.direction, styles.norte]}>N</Text>
        <Text style={[styles.direction, styles.sur]}>S</Text>
        <Text style={[styles.direction, styles.este]}>E</Text>
        <Text style={[styles.direction, styles.oeste]}>O</Text>

        <View
          style={[
            styles.agujaContainer,
            {
              transform: [
                {
                  rotate: `${360 - grados}deg`,
                },
              ],
            },
          ]}
        >
          <View style={styles.agujaNorte} />
          <View style={styles.agujaSur} />
        </View>

        <View style={styles.centro} />
      </View>

      <Text style={styles.grados}>
        {grados}°
      </Text>

      <Text style={styles.direccionActual}>
        {obtenerDireccion(grados)}
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
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
  },

  compassTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },

  compass: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: "#222",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  direction: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "bold",
  },

  norte: {
    top: 8,
  },

  sur: {
    bottom: 8,
  },

  este: {
    right: 12,
  },

  oeste: {
    left: 12,
  },

  agujaContainer: {
    width: 10,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  agujaNorte: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 70,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "black",
  },

  agujaSur: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 70,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "red",
  },

  centro: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#222",
  },

  grados: {
    marginTop: 15,
    fontSize: 30,
    fontWeight: "bold",
  },

  direccionActual: {
    fontSize: 24,
    fontWeight: "bold",
  },
});