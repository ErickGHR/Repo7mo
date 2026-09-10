import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import SplashScreen from './screens/SplashScreen';
import DrawerNavigation from './navigation/DrawerNavigation';

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  if (mostrarSplash) {
    return (
      <SplashScreen
        onFinish={() => setMostrarSplash(false)}
      />
    );
  }

  return (
    <NavigationContainer>
      <DrawerNavigation />
    </NavigationContainer>
  );
}