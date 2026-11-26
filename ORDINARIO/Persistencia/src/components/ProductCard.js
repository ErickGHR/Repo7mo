import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const formatMoney = (amount) => `$${Number(amount).toFixed(2)}`;

export default function ProductCard({ product, index, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.badge}>
          {/* index solo decora el orden de la lista; id sigue siendo la identidad real. */}
          <Text style={styles.badgeText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{product.producto}</Text>
          <Text style={styles.description}>
            {product.descripcion || 'Sin descripción'}
          </Text>
        </View>
        <Text style={styles.price}>{formatMoney(product.precio)}</Text>
      </View>

      <View style={styles.actions}>
        {/* La tarjeta no edita ni borra: avisa a App.js mediante callbacks. */}
        <TouchableOpacity
          onPress={() => onEdit(product)}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${product.producto}`}
        >
          <Text style={styles.editText}>Editar · UPDATE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(product)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${product.producto}`}
        >
          <Text style={styles.deleteText}>Eliminar · DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e9ece7', marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#edf4ee', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  badgeText: { color: '#34735a', fontWeight: '800', fontSize: 11 },
  info: { flex: 1 },
  name: { color: '#24362e', fontWeight: '800', fontSize: 14 },
  description: { color: '#89938c', fontSize: 11, marginTop: 4 },
  price: { color: '#176b52', fontSize: 14, fontWeight: '800' },
  actions: { borderTopWidth: 1, borderTopColor: '#f0f1ee', marginTop: 13, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  editButton: { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#edf4ee', borderRadius: 8 },
  editText: { color: '#236e52', fontSize: 11, fontWeight: '800' },
  deleteButton: { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#fff0ed', borderRadius: 8 },
  deleteText: { color: '#bc5547', fontSize: 11, fontWeight: '800' },
});
