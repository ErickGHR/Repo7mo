import React from "react";
import { useState } from "react";
import {
  View,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";

import CustomModal from "./componentes/CustomModal";
import DemoFlatList from "./componentes/DemoFlatList";
import DemoSectionList from "./componentes/DemoSectionList";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);

  const objetoContenido = {
    valor: "Juan Perez",
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.boton}>
        <Button
          title="Ver mensaje"
          onPress={() => setModalVisible(true)}
        />
      </View>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        contenido={objetoContenido}
      />

      <View style={styles.listas}>
        <View style={styles.lista}>
          <Text style={styles.titulo}>FlatList</Text>

          <DemoFlatList />
        </View>

        <View style={styles.lista}>
          <Text style={styles.titulo}>SectionList</Text>

          <DemoSectionList />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    padding: 20,
  },

  boton: {
    marginBottom: 20,
  },

  listas: {
    flex: 1,
    flexDirection: "row",
    gap: 20,
  },

  lista: {
    flex: 1,
    backgroundColor: "white",
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
  },
});