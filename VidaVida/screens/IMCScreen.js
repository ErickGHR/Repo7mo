import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';
import CustomModal from '../components/CustomModal';

export default function IMCScreen() {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setImc] = useState(null);
  const [categoria, setCategoria] = useState('');
  const [modalVisible, setModalVisible] =
    useState(false);

  const calcularIMC = () => {
    const pesoNumero =
      parseFloat(peso.replace(',', '.'));

    const alturaNumero =
      parseFloat(altura.replace(',', '.'));

    if (
      !pesoNumero ||
      !alturaNumero ||
      pesoNumero <= 0 ||
      alturaNumero <= 0
    ) {
      return;
    }

    const resultado =
      pesoNumero /
      (alturaNumero * alturaNumero);

    let textoCategoria = '';

    if (resultado < 18.5) {
      textoCategoria = 'Bajo peso';
    } else if (resultado < 25) {
      textoCategoria = 'Peso normal';
    } else if (resultado < 30) {
      textoCategoria = 'Sobrepeso';
    } else {
      textoCategoria = 'Obesidad';
    }

    setImc(resultado.toFixed(2));
    setCategoria(textoCategoria);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Calculadora de IMC
      </Text>

      <Text style={styles.label}>
        Peso en kilogramos
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 80"
        keyboardType="numeric"
        value={peso}
        onChangeText={setPeso}
      />

      <Text style={styles.label}>
        Altura en metros
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 1.80"
        keyboardType="numeric"
        value={altura}
        onChangeText={setAltura}
      />

      <CustomButton
        title="Calcular IMC"
        onPress={calcularIMC}
      />

      <CustomModal
        visible={modalVisible}
        onClose={() =>
          setModalVisible(false)
        }
        title="Resultado"
      >
        <Text style={styles.result}>
          IMC: {imc}
        </Text>

        <Text style={styles.category}>
          {categoria}
        </Text>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    marginBottom: 5,
  },

  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  result: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  category: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10,
  },
});