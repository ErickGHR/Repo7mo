import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';
import CustomModal from '../components/CustomModal';

export default function PropinasScreen() {
  const [cuenta, setCuenta] = useState('');
  const [porcentaje, setPorcentaje] =
    useState('');

  const [propina, setPropina] =
    useState(null);

  const [total, setTotal] =
    useState(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const calcularPropina = () => {
    const cuentaNumero =
      parseFloat(cuenta.replace(',', '.'));

    const porcentajeNumero =
      parseFloat(porcentaje.replace(',', '.'));

    if (
      !cuentaNumero ||
      porcentajeNumero < 0 ||
      isNaN(porcentajeNumero)
    ) {
      return;
    }

    const resultadoPropina =
      cuentaNumero *
      (porcentajeNumero / 100);

    const resultadoTotal =
      cuentaNumero + resultadoPropina;

    setPropina(
      resultadoPropina.toFixed(2)
    );

    setTotal(
      resultadoTotal.toFixed(2)
    );

    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Calculadora de propinas
      </Text>

      <Text style={styles.label}>
        Total de la cuenta
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 500"
        keyboardType="numeric"
        value={cuenta}
        onChangeText={setCuenta}
      />

      <Text style={styles.label}>
        Porcentaje de propina
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 15"
        keyboardType="numeric"
        value={porcentaje}
        onChangeText={setPorcentaje}
      />

      <CustomButton
        title="Calcular"
        onPress={calcularPropina}
      />

      <CustomModal
        visible={modalVisible}
        onClose={() =>
          setModalVisible(false)
        }
        title="Resultado"
      >
        <Text style={styles.result}>
          Propina: ${propina}
        </Text>

        <Text style={styles.result}>
          Total: ${total}
        </Text>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
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
    fontSize: 22,
    textAlign: 'center',
    marginVertical: 5,
  },
});