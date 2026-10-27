import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import ConnectionBanner from './src/components/ConnectionBanner';
import InventorySummary from './src/components/InventorySummary';
import ProductForm from './src/components/ProductForm';
import ProductList from './src/components/ProductList';
import {
  createProduct,
  deleteProduct,
  getProducts,
  testConnection,
  updateProduct,
} from './src/services/productService';

export default function App() {
  // App coordina los datos y las acciones; cada componente se encarga de su UI.
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [connection, setConnection] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(data);
      setConnection('connected');
    } catch (requestError) {
      setError(requestError.message);
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // La primera carga comprueba la conexión antes de consultar la lista.
  const connectAndLoad = useCallback(async () => {
    setConnection('checking');
    setError('');
    try {
      await testConnection();
      setConnection('connected');
      await refreshProducts();
    } catch (requestError) {
      setError(requestError.message);
      setConnection('error');
      setLoading(false);
    }
  }, [refreshProducts]);

  useEffect(() => {
    connectAndLoad();
  }, [connectAndLoad]);

  const handleSave = async (formValues) => {
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formValues);
      } else {
        await createProduct(formValues);
      }
      setEditingProduct(null);
      await refreshProducts();
    } catch (requestError) {
      Alert.alert('No se pudo guardar', requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Quieres eliminar “${product.producto}” de forma permanente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              if (editingProduct?.id === product.id) setEditingProduct(null);
              await refreshProducts();
            } catch (requestError) {
              Alert.alert('No se pudo eliminar', requestError.message);
            }
          },
        },
      ],
    );
  };

  const listHeader = (
    <>
      <View style={styles.header}>
        <ConnectionBanner status={connection} error={error} />
        <Text style={styles.title}>Tu catálogo,</Text>
        <Text style={styles.titleAccent}>bajo control.</Text>
        <Text style={styles.subtitle}>Administra tus productos en un solo lugar.</Text>
      </View>

      <InventorySummary products={products} />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>
          {editingProduct ? 'Editar producto' : 'Nuevo producto'}
        </Text>
        <Text style={styles.step}>01 / CRUD</Text>
      </View>

      <ProductForm
        key={editingProduct?.id ?? 'new-product'}
        initialProduct={editingProduct}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setEditingProduct(null)}
      />

      <View style={styles.listHeading}>
        <View>
          <Text style={styles.sectionTitle}>Inventario</Text>
          <Text style={styles.listSubtitle}>Tus productos más recientes</Text>
        </View>
        <TouchableOpacity onPress={refreshProducts} accessibilityRole="button">
          <Text style={styles.refresh}>↻  Actualizar</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f2" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ProductList
          products={products}
          loading={loading}
          error={error}
          header={listHeader}
          onRefresh={refreshProducts}
          onEdit={setEditingProduct}
          onDelete={handleDelete}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#f5f6f2' },
  header: { paddingTop: 24, paddingBottom: 22 },
  title: { color: '#172b24', fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 42 },
  titleAccent: { color: '#218262', fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 42 },
  subtitle: { color: '#707b74', fontSize: 14, marginTop: 12 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#1d3028', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  step: { color: '#89948d', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  listSubtitle: { color: '#89938c', fontSize: 12, marginTop: 3 },
  refresh: { color: '#217658', fontSize: 12, fontWeight: '700' },
});
