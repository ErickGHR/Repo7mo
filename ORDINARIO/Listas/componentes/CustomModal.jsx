import React from "react";
import { StyleSheet, Text, View, Button, Modal } from "react-native";

const CustomModal = ({ visible, onClose, contenido }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.center}>
        <View style={styles.contenido}>
          <Text>
            Hola, {contenido ? contenido.valor : "Mundo"}
          </Text>

          <Button
            title="Cerrar"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  contenido: {
    width: 300,
    padding: 30,
    backgroundColor: "rgb(73,156,200)",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    borderRadius: 15,
  },
});