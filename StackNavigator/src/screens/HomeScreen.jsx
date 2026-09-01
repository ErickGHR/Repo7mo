import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        gap: 15,
      }}
    >
      <Text style={{ fontSize: 24, textAlign: 'center' }}>
        Menú Principal
      </Text>

      <Button
        title="Calculadora IMC"
        onPress={() => navigation.navigate('IMC')}
      />

      <Button
        title="Calculadora de Divisas"
        onPress={() => navigation.navigate('divisas')}
      />

      <Button
        title="Calculadora de Propinas"
        onPress={() => navigation.navigate('tips')}
      />
    </View>
  );
}