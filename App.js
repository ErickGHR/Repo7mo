import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Cat from './componentes/cat';
import Mensaje from './componentes/mensaje';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles2.container}>Oh yeah, diamantes</Text>
      <Cat></Cat>
      <Mensaje style={styles3.container} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

  const styles2 = StyleSheet.create({
    container: {
      color: 'green',
      backgroundColor: 'red',
    },

  })

    const styles3 = StyleSheet.create({
    container: {
      color: 'green',
      backgroundColor: 'red',
    },

  })




