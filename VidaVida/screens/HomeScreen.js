import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';

export default function HomeScreen({
  navigation,
}) {
  const abrirHerramienta = (pantalla) => {
    navigation.navigate(
      'Herramientas',
      {
        screen: pantalla,
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        VidaVida
      </Text>

      <Text style={styles.subtitle}>
        Selecciona una herramienta
      </Text>

      <View style={styles.menu}>
        <CustomButton
          title="Lanzar dados"
          onPress={() =>
            abrirHerramienta('Dados')
          }
        />

        <CustomButton
          title="Calcular IMC"
          onPress={() =>
            abrirHerramienta('IMC')
          }
        />

        <CustomButton
          title="Calcular propina"
          onPress={() =>
            abrirHerramienta('Propinas')
          }
        />

        <CustomButton
          title="Lista del súper"
          onPress={() =>
            abrirHerramienta('Super')
          }
        />
      </View>
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
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  menu: {
    width: '100%',
  },
});