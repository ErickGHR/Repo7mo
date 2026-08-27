import { StyleSheet, Text, View, Modal, Button } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [modal, setModal] = useState(false);

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modal}
      >
        <View style={styles.center}>
          <View style={styles.contenido}>
            <Text>Esto es un modal</Text>

            <Button
              title="Close Modal"
              onPress={() => setModal(false)}
            />
          </View>
        </View>
      </Modal>

      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Text>Este texto esta fuera del modal</Text>
      <Button
        title="Open Modal"
        onPress={() => setModal(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  contenido: {
    width: 300,
    padding: 30,
    backgroundColor: 'rgba(73,156,200,1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    borderRadius: 15,
  },
});