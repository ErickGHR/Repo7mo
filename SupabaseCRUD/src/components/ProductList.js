import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import ProductCard from './ProductCard';

function EmptyInventory({ loading, error }) {
  if (loading) return <ActivityIndicator color="#176b52" style={styles.loader} />;
  if (error) return null;

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>◌</Text>
      <Text style={styles.emptyTitle}>Aún no hay productos</Text>
      <Text style={styles.emptyText}>Agrega el primero desde el formulario.</Text>
    </View>
  );
}

export default function ProductList({
  products,
  loading,
  error,
  header,
  onRefresh,
  onEdit,
  onDelete,
}) {
  return (
    <FlatList
      data={products}
      keyExtractor={(product) => String(product.id)}
      renderItem={({ item, index }) => (
        <ProductCard
          product={item}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyInventory loading={loading} error={error} />}
      ListFooterComponent={
        <Text style={styles.footer}>HECHO CON EXPO + SUPABASE</Text>
      }
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshing={loading}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 30 },
  loader: { marginVertical: 22 },
  empty: { backgroundColor: '#fff', borderRadius: 14, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#e9ece7' },
  emptyIcon: { color: '#8ab59e', fontSize: 30 },
  emptyTitle: { color: '#33463c', fontWeight: '800', fontSize: 14, marginTop: 7 },
  emptyText: { color: '#89938c', fontSize: 12, marginTop: 5 },
  footer: { textAlign: 'center', color: '#a1aaa3', fontSize: 9, letterSpacing: 1.5, fontWeight: '800', marginTop: 23 },
});
