import React from 'react';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import DadosScreen from '../screens/DadosScreen';
import IMCScreen from '../screens/IMCScreen';
import PropinasScreen from '../screens/PropinasScreen';
import SuperScreen from '../screens/SuperScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <Tab.Navigator
      initialRouteName="Dados"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Dados"
        component={DadosScreen}
      />

      <Tab.Screen
        name="IMC"
        component={IMCScreen}
      />

      <Tab.Screen
        name="Propinas"
        component={PropinasScreen}
      />

      <Tab.Screen
        name="Super"
        component={SuperScreen}
        options={{
          tabBarLabel: 'Súper',
        }}
      />
    </Tab.Navigator>
  );
}