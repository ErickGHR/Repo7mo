import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ImcScreen from './src/screens/IMCScreen';
import CurrencyScreen from './src/screens/CurrencyScreen';
import TipScreen from './src/screens/TipScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Menú Principal' }}
        />

        <Stack.Screen
          name="IMC"
          component={ImcScreen}
          options={{ title: 'Calculadora IMC' }}
        />

        <Stack.Screen
          name="divisas"
          component={CurrencyScreen}
          options={{ title: 'Calculadora de Divisas' }}
        />

        <Stack.Screen
          name="tips"
          component={TipScreen}
          options={{ title: 'Calculadora de Propinas' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}