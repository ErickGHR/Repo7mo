import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const formatMoney = (amount) => `$${Number(amount).toFixed(2)}`;

export default function InventorySummary({ products }) {
  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.precio || 0),
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.number}>{products.length}</Text>
        <Text style={styles.label}>PRODUCTOS</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.number}>{formatMoney(totalValue)}</Text>
        <Text style={styles.label}>VALOR TOTAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#e8eee8', borderRadius: 16, padding: 17, marginBottom: 27, alignItems: 'center' },
  stat: { flex: 1 },
  number: { fontSize: 21, color: '#173b2d', fontWeight: '800' },
  label: { color: '#75847b', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },
  divider: { height: 38, width: 1, backgroundColor: '#d0dbd2', marginHorizontal: 13 },
});
