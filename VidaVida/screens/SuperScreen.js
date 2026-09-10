import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';

export default function SuperScreen() {
  const [producto, setProducto] =
    useState('');

  const [productos, setProductos] =
    useState([]);

  const agregarProducto = () => {
    if (producto.trim() === '') {
      return;
    }

    const nuevoProducto = {
      id: Date.now().toString(),
      nombre: producto.trim(),
      comprado: false,
    };

    setProductos([
      ...productos,
      nuevoProducto,
    ]);

    setProducto('');
  };

  const cambiarEstado = (id) => {
    const nuevaLista = productos.map(
      (item) => {
        if (item.id === id) {
          return {
            ...item,
            comprado: !item.comprado,
          };
        }

        return item;
      }
    );

    setProductos(nuevaLista);
  };

  const eliminarProducto = (id) => {
    const nuevaLista =
      productos.filter(
        (item) => item.id !== id
      );

    setProductos(nuevaLista);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Lista del súper
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Agregar producto"
        value={producto}
        onChangeText={setProducto}
        onSubmitEditing={agregarProducto}
      />

      <CustomButton
        title="Agregar"
        onPress={agregarProducto}
      />

      <FlatList
        data={productos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay productos en la lista
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity
              style={styles.productContainer}
              onPress={() =>
                cambiarEstado(item.id)
              }
            >
              <Text style={styles.check}>
                {item.comprado
                  ? '✓'
                  : '○'}
              </Text>

              <Text
                style={[
                  styles.product,
                  item.comprado &&
                    styles.comprado,
                ]}
              >
                {item.nombre}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.delete}
              onPress={() =>
                eliminarProducto(
                  item.id
                )
              }
            >
              <Text style={styles.deleteText}>
                X
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#f2f2f2',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 20,
  },

  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  item: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  productContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  check: {
    fontSize: 24,
    marginRight: 10,
  },

  product: {
    fontSize: 18,
  },

  comprado: {
    textDecorationLine: 'line-through',
    color: '#888',
  },

  delete: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 17,
    color: '#777',
  },
});