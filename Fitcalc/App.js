import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Modal,
} from "react-native";

export default function App() {
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [resultado, setResultado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const calcularIMC = () => {
    const pesoNumero = Number(peso);
    const alturaNumero = Number(altura) / 100;

    const imc = pesoNumero / (alturaNumero * alturaNumero);

    setResultado(imc.toFixed(1));

    if (imc < 18.5) {
      setMensaje("Bajo peso");
    } else if (imc < 25) {
      setMensaje("Peso normal");
    } else if (imc < 30) {
      setMensaje("Sobrepeso");
    } else {
      setMensaje("Obesidad");
    }

    setModalVisible(true);
  };

  const limpiar = () => {
    setPeso("");
    setAltura("");
    setResultado("");
    setMensaje("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Calculadora IMC</Text>

      <Text style={styles.label}>Peso (kg)</Text>

      <TextInput
        style={styles.input}
        value={peso}
        onChangeText={(texto) => setPeso(texto)}
        placeholder="Ejemplo: 70"/>

      <Text style={styles.label}>Altura (cm)</Text>

      <TextInput
        style={styles.input}
        value={altura}
        onChangeText={(texto) => setAltura(texto)}
        placeholder="Ejemplo: 175"/>

      <View style={styles.boton}>
        <Button
          title="Calcular IMC"
          onPress={calcularIMC}/>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        >
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.resultadoTitulo}>
              Resultado IMC
            </Text>

            <Text style={styles.numero}>
              {resultado}
            </Text>

            <Text style={styles.mensaje}>
              {mensaje}
            </Text>

            <View style={styles.botonAceptar}>
              <Button
                title="Aceptar"
                onPress={limpiar}/>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#02d3fd",
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  label: {
    fontSize: 18,
    marginBottom: 5,
  },

  input: {
    width: "100%",
    height: 45,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#999",
    marginBottom: 20,
    padding: 10,
  },

  boton: {
    width: "100%",
    marginBottom: 30,
  },

  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    width: 320,
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
  },

  resultadoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  numero: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 10,
  },

  mensaje: {
    fontSize: 20,
    marginBottom: 20,
  },

  botonAceptar: {
    width: "100%",
  },
});