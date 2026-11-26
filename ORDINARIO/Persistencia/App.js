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
import SectionHeading from './src/components/SectionHeading';
import {
  createProduct,
  deleteProduct,
  getProducts,
  testConnection,
  updateProduct,
} from './src/services/productService';

export default function App() {
  // App es el componente contenedor: coordina datos, eventos y servicio.
  // Los componentes hijos se enfocan en presentar UI y devolver eventos por props.
  const [products, setProducts] = useState([]);
  // null significa "modo alta"; un objeto significa "modo edición".
  const [editingProduct, setEditingProduct] = useState(null);
  // checking | connected | error controla el mensaje visual de conexión.
  const [connection, setConnection] = useState('checking');
  // loading corresponde a lecturas; saving corresponde al alta/edición.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // READ: obtiene la lista actualizada y traduce la respuesta de red a estado React.
  const refreshProducts = useCallback(async () => {
    // El indicador aparece antes de iniciar la consulta.
    setLoading(true);
    // Se limpia el mensaje anterior para no mostrar un error ya resuelto.
    setError('');
    try {
      // getProducts devuelve filas o lanza el error recibido de Supabase.
      const data = await getProducts();
      // setProducts provoca que React vuelva a renderizar resumen y lista.
      setProducts(data);
      setConnection('connected');
    } catch (requestError) {
      // Guardamos el error para explicarlo bajo el estado de conexión.
      setError(requestError.message);
      setConnection('error');
    } finally {
      // finally corre tanto si la consulta funcionó como si falló.
      setLoading(false);
    }
  }, []);

  // CONEXIÓN + READ inicial: prueba acceso a la tabla y después obtiene la lista.
  const connectAndLoad = useCallback(async () => {
    setConnection('checking');
    setError('');
    try {
      // Una consulta pequeña confirma URL, clave, tabla y permiso de lectura.
      await testConnection();
      setConnection('connected');
      // La prueba no sustituye a READ; ahora cargamos todos los productos.
      await refreshProducts();
    } catch (requestError) {
      setError(requestError.message);
      setConnection('error');
      setLoading(false);
    }
  }, [refreshProducts]);

  useEffect(() => {
    // useEffect se ejecuta al montar App; no se llama durante cada render.
    connectAndLoad();
  }, [connectAndLoad]);

  const handleSave = async (formValues) => {
    // La pantalla pasa el formulario a modo "guardando" para evitar doble toque.
    setSaving(true);
    try {
      if (editingProduct) {
        // Si hay un producto seleccionado, la operación es UPDATE.
        await updateProduct(editingProduct.id, formValues);
      } else {
        // Si no hay selección, la operación es CREATE.
        await createProduct(formValues);
      }
      // Tras guardar, se vuelve al modo de alta y se consulta el resultado real.
      setEditingProduct(null);
      await refreshProducts();
    } catch (requestError) {
      // Alert muestra errores de validación de servidor/permisos al usuario.
      Alert.alert('No se pudo guardar', requestError.message);
    } finally {
      // Se habilita de nuevo el botón incluso si Supabase devolvió un error.
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    // DELETE es destructivo, por eso primero se abre una confirmación nativa.
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
              // Solo se elimina después de que la persona confirme.
              await deleteProduct(product.id);
              // Si se estaba editando esa fila, se descarta ese formulario.
              if (editingProduct?.id === product.id) setEditingProduct(null);
              // READ posterior mantiene la pantalla sincronizada con la base.
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
    // FlatList recibe este bloque como cabecera desplazable junto al inventario.
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Tu catálogo,</Text>
        <Text style={styles.titleAccent}>bajo control.</Text>
        <Text style={styles.subtitle}>
          Sigue cada etapa del CRUD y observa cómo los datos viajan a Supabase.
        </Text>
      </View>

      <SectionHeading
        number="01"
        title="Conexión con Supabase"
        description="Primero comprobamos que la URL, la clave y la tabla productos respondan."
      />
      <ConnectionBanner status={connection} error={error} />

      <SectionHeading
        number="02"
        title={editingProduct ? 'Actualizar un producto' : 'Crear un producto'}
        description={editingProduct
          ? 'Los campos se cargaron desde la tarjeta seleccionada; guardar enviará UPDATE.'
          : 'Completa los campos y guardar enviará un INSERT para crear una fila.'}
      />

      {/* La key hace que React reinicie el formulario al cambiar de producto. */}
      <ProductForm
        key={editingProduct?.id ?? 'new-product'}
        initialProduct={editingProduct}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setEditingProduct(null)}
      />

      <SectionHeading
        number="03"
        title="Resumen del inventario"
        description="Este componente deriva el conteo y el valor total de las filas leídas."
      />
      <InventorySummary products={products} />

      <SectionHeading
        number="04"
        title="Consultar productos"
        description="FlatList representa cada fila como una tarjeta con acciones UPDATE y DELETE."
      />
      <View style={styles.listHeading}>
        <Text style={styles.listSubtitle}>Los registros más recientes aparecen primero.</Text>
        <TouchableOpacity onPress={refreshProducts} accessibilityRole="button">
          <Text style={styles.refresh}>↻  Volver a consultar</Text>
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
        {/* Props transportan datos y callbacks del contenedor a la lista. */}
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
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13, marginTop: 2 },
  listSubtitle: { color: '#89938c', fontSize: 12, flex: 1, marginRight: 10 },
  refresh: { color: '#217658', fontSize: 12, fontWeight: '700' },
});
