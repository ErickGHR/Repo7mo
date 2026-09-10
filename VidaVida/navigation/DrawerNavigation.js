import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from '../screens/HomeScreen';
import TabNavigation from './TabNavigation';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
  return (
    <Drawer.Navigator initialRouteName="Inicio">
      <Drawer.Screen
        name="Inicio"
        component={HomeScreen}
      />

      <Drawer.Screen
        name="Herramientas"
        component={TabNavigation}
      />
    </Drawer.Navigator>
  );
}