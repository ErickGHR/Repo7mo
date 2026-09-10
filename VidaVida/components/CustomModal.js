import React from 'react';

import {
  Modal,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import CustomButton from './CustomButton';

export default function CustomModal({
  visible,
  onClose,
  title,
  children,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.background}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {title}
          </Text>

          <View style={styles.content}>
            {children}
          </View>

          <CustomButton
            title="Cerrar"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  content: {
    marginBottom: 15,
  },
});