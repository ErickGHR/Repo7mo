import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function CustomButton({
  title,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.text}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },

  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});