import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase } from './supabase';

const money = (value) => `$${Number(value).toFixed(2)}`;

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setError('Falta configurar Supabase. Copia .env.example a .env y agrega tus credenciales.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: requestError } = await supabase
      .from('productos').select('*').order('created_at', { ascending: false });
    if (requestError) setError(requestError.message);
    else { setItems(data ?? []); setError(''); }
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const clearForm = () => { setName(''); setDescription(''); setPrice(''); setEditingId(null); };

  const saveProduct = async () => {
    const numericPrice = Number(price.replace(',', '.'));
    if (!name.trim()) return Alert.alert('Falta el producto', 'Escribe el nombre del producto.');
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0)
      return Alert.alert('Precio inválido', 'Escribe un precio válido mayor o igual a cero.');
    if (!supabase) return Alert.alert('Configura Supabase', 'Agrega la URL y la publishable key en .env.');
    setSaving(true);
    const values = { producto: name.trim(), descripcion: description.trim(), precio: numericPrice };
    const result = editingId
      ? await supabase.from('productos').update(values).eq('id', editingId)
      : await supabase.from('productos').insert(values);
    setSaving(false);
    if (result.error) return Alert.alert('No se pudo guardar', result.error.message);
    clearForm();
    await loadProducts();
  };

  const startEdit = (item) => {
    setEditingId(item.id); setName(item.producto); setDescription(item.descripcion ?? '');
    setPrice(String(item.precio));
  };

  const deleteProduct = (item) => Alert.alert(
    'Eliminar producto', `¿Quieres eliminar “${item.producto}” de forma permanente?`,
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => {
      const { error: deleteError } = await supabase.from('productos').delete().eq('id', item.id);
      if (deleteError) Alert.alert('No se pudo eliminar', deleteError.message);
      else { if (editingId === item.id) clearForm(); await loadProducts(); }
    } }],
  );

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.productBadge}><Text style={styles.productBadgeText}>{String(index + 1).padStart(2, '0')}</Text></View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.producto}</Text>
          <Text style={styles.productDescription}>{item.descripcion || 'Sin descripción'}</Text>
        </View>
        <Text style={styles.productPrice}>{money(item.precio)}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => startEdit(item)} style={styles.editButton} accessibilityLabel={`Editar ${item.producto}`}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteProduct(item)} style={styles.deleteButton} accessibilityLabel={`Eliminar ${item.producto}`}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f2" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={items} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <>
              <View style={styles.header}>
                <View style={styles.eyebrow}><View style={styles.liveDot} /><Text style={styles.eyebrowText}>CONECTADO A SUPABASE</Text></View>
                <Text style={styles.title}>Tu catálogo,</Text><Text style={styles.titleAccent}>bajo control.</Text>
                <Text style={styles.subtitle}>Administra tus productos en un solo lugar.</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={styles.statNumber}>{items.length}</Text><Text style={styles.statLabel}>PRODUCTOS</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.stat}><Text style={styles.statNumber}>{money(items.reduce((sum, item) => sum + Number(item.precio || 0), 0))}</Text><Text style={styles.statLabel}>VALOR TOTAL</Text></View>
              </View>
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{editingId ? 'Editar producto' : 'Nuevo producto'}</Text><Text style={styles.step}>01 / CRUD</Text></View>
              <View style={styles.form}>
                <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Café de Veracruz" placeholderTextColor="#9aa19a" maxLength={100} />
                <Text style={styles.label}>DESCRIPCIÓN</Text>
                <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Cuéntanos un poco más..." placeholderTextColor="#9aa19a" maxLength={500} multiline />
                <Text style={styles.label}>PRECIO (MXN)</Text>
                <View style={styles.priceInput}><Text style={styles.currency}>$</Text><TextInput style={styles.priceField} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor="#9aa19a" keyboardType="decimal-pad" /></View>
                <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={saveProduct} disabled={saving}>
                  <Text style={styles.primaryButtonText}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios  →' : 'Agregar producto  →'}</Text>
                </TouchableOpacity>
                {editingId && <TouchableOpacity style={styles.cancelButton} onPress={clearForm}><Text style={styles.cancelText}>Cancelar edición</Text></TouchableOpacity>}
              </View>
              <View style={styles.listHeading}><View><Text style={styles.sectionTitle}>Inventario</Text><Text style={styles.listSubtitle}>Tus productos más recientes</Text></View><TouchableOpacity onPress={loadProducts}><Text style={styles.refresh}>↻  Actualizar</Text></TouchableOpacity></View>
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
              {loading ? <ActivityIndicator color="#176b52" style={styles.loader} /> : null}
              {!loading && items.length === 0 && !error ? <View style={styles.empty}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.emptyTitle}>Aún no hay productos</Text><Text style={styles.emptyText}>Agrega el primero desde el formulario.</Text></View> : null}
            </>
          )}
          ListFooterComponent={<Text style={styles.footer}>HECHO CON EXPO + SUPABASE</Text>}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#f5f6f2' }, content: { paddingHorizontal: 22, paddingBottom: 30 },
  header: { paddingTop: 24, paddingBottom: 22 }, eyebrow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2e9875', marginRight: 8 }, eyebrowText: { color: '#477365', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#172b24', fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 42 }, titleAccent: { color: '#218262', fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 42 }, subtitle: { color: '#707b74', fontSize: 14, marginTop: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: '#e8eee8', borderRadius: 16, padding: 17, marginBottom: 27, alignItems: 'center' }, stat: { flex: 1 }, statNumber: { fontSize: 21, color: '#173b2d', fontWeight: '800' }, statLabel: { color: '#75847b', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 }, statDivider: { height: 38, width: 1, backgroundColor: '#d0dbd2', marginHorizontal: 13 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, sectionTitle: { color: '#1d3028', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }, step: { color: '#89948d', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  form: { backgroundColor: '#fff', padding: 17, borderRadius: 17, borderWidth: 1, borderColor: '#e9ece7', marginBottom: 29 }, label: { color: '#67756d', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7, marginTop: 5 }, input: { backgroundColor: '#f7f8f5', borderWidth: 1, borderColor: '#eaede8', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#24362e', fontSize: 14, marginBottom: 12 }, multiline: { minHeight: 70, textAlignVertical: 'top' }, priceInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f5', borderWidth: 1, borderColor: '#eaede8', borderRadius: 10, paddingHorizontal: 13, marginBottom: 16 }, currency: { fontSize: 16, fontWeight: '700', color: '#63736a' }, priceField: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: '#24362e', fontSize: 15 },
  primaryButton: { backgroundColor: '#176b52', minHeight: 48, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }, disabled: { opacity: 0.65 }, primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, cancelButton: { alignItems: 'center', paddingTop: 12 }, cancelText: { color: '#65746b', fontSize: 12, fontWeight: '700' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }, listSubtitle: { color: '#89938c', fontSize: 12, marginTop: 3 }, refresh: { color: '#217658', fontSize: 12, fontWeight: '700' }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e9ece7', marginBottom: 10 }, cardTop: { flexDirection: 'row', alignItems: 'center' }, productBadge: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#edf4ee', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, productBadgeText: { color: '#34735a', fontWeight: '800', fontSize: 11 }, productInfo: { flex: 1 }, productName: { color: '#24362e', fontWeight: '800', fontSize: 14 }, productDescription: { color: '#89938c', fontSize: 11, marginTop: 4 }, productPrice: { color: '#176b52', fontSize: 14, fontWeight: '800' }, cardActions: { borderTopWidth: 1, borderTopColor: '#f0f1ee', marginTop: 13, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 }, editButton: { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#edf4ee', borderRadius: 8 }, editText: { color: '#236e52', fontSize: 11, fontWeight: '800' }, deleteButton: { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#fff0ed', borderRadius: 8 }, deleteText: { color: '#bc5547', fontSize: 11, fontWeight: '800' },
  loader: { marginVertical: 22 }, empty: { backgroundColor: '#fff', borderRadius: 14, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#e9ece7' }, emptyIcon: { color: '#8ab59e', fontSize: 30 }, emptyTitle: { color: '#33463c', fontWeight: '800', fontSize: 14, marginTop: 7 }, emptyText: { color: '#89938c', fontSize: 12, marginTop: 5 }, errorBox: { backgroundColor: '#fff0ed', padding: 13, borderRadius: 10, marginBottom: 12 }, errorText: { color: '#a54135', fontSize: 12 }, footer: { textAlign: 'center', color: '#a1aaa3', fontSize: 9, letterSpacing: 1.5, fontWeight: '800', marginTop: 23 },
});
