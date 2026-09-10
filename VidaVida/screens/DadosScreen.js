import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';

export default function DadosScreen() {
  const [dado1, setDado1] = useState(1);
  const [dado2, setDado2] = useState(1);

  const lanzarDados = () => {
    const numero1 =
      Math.floor(Math.random() * 6) + 1;

    const numero2 =
      Math.floor(Math.random() * 6) + 1;

    setDado1(numero1);
    setDado2(numero2);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Lanzar dados
      </Text>

      <View style={styles.dadosContainer}>
        <View style={styles.dado}>
          <Text style={styles.numero}>
            {dado1}
          </Text>
        </View>

        <View style={styles.dado}>
          <Text style={styles.numero}>
            {dado2}
          </Text>
        </View>
      </View>

      <Text style={styles.total}>
        Total: {dado1 + dado2}
      </Text>

      <CustomButton
        title="Lanzar"
        onPress={lanzarDados}
      />
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },

  dadosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },

  dado: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  numero: {
    fontSize: 50,
    fontWeight: 'bold',
  },

  total: {
    textAlign: 'center',
    fontSize: 24,
    marginVertical: 30,
  },
});