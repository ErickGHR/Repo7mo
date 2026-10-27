import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProductForm({ initialProduct, saving, onSave, onCancel }) {
  // Los estados guardan lo que la persona escribe; los TextInput son controlados.
  const [name, setName] = useState(initialProduct?.producto ?? '');
  const [description, setDescription] = useState(initialProduct?.descripcion ?? '');
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.precio) : '',
  );

  // Al seleccionar otro producto para editar, carga sus valores en el formulario.
  // Al crear, initialProduct es null y los campos quedan vacíos.
  useEffect(() => {
    setName(initialProduct?.producto ?? '');
    setDescription(initialProduct?.descripcion ?? '');
    setPrice(initialProduct ? String(initialProduct.precio) : '');
  }, [initialProduct]);

  const submit = () => {
    // El teclado decimal puede entregar coma; JavaScript calcula con punto decimal.
    const numericPrice = Number(price.replace(',', '.'));
    if (!name.trim()) {
      Alert.alert('Falta el producto', 'Escribe el nombre del producto.');
      return;
    }
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert('Precio inválido', 'Escribe un precio válido mayor o igual a cero.');
      return;
    }

    // Se envía un objeto limpio al padre. Aquí no se hace ninguna consulta de red.
    onSave({
      producto: name.trim(),
      descripcion: description.trim(),
      precio: numericPrice,
    });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
      {/* value + onChangeText hacen que React conserve el texto del campo. */}
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Café de Veracruz"
        placeholderTextColor="#9aa19a"
        maxLength={100}
      />

      <Text style={styles.label}>DESCRIPCIÓN</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Cuéntanos un poco más..."
        placeholderTextColor="#9aa19a"
        maxLength={500}
        multiline
      />

      <Text style={styles.label}>PRECIO (MXN)</Text>
      <View style={styles.priceInput}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.priceField}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          placeholderTextColor="#9aa19a"
          keyboardType="decimal-pad"
        />
      </View>

      {/* saving bloquea otro envío mientras App espera la respuesta de Supabase. */}
      <TouchableOpacity
        style={[styles.primaryButton, saving && styles.disabled]}
        onPress={submit}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {saving
            ? 'Guardando…'
            : initialProduct
              ? 'Guardar cambios  →'
              : 'Agregar producto  →'}
        </Text>
      </TouchableOpacity>

      {initialProduct ? (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar edición</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: '#fff', padding: 17, borderRadius: 17, borderWidth: 1, borderColor: '#e9ece7', marginBottom: 29 },
  label: { color: '#67756d', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7, marginTop: 5 },
  input: { backgroundColor: '#f7f8f5', borderWidth: 1, borderColor: '#eaede8', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#24362e', fontSize: 14, marginBottom: 12 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  priceInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f5', borderWidth: 1, borderColor: '#eaede8', borderRadius: 10, paddingHorizontal: 13, marginBottom: 16 },
  currency: { fontSize: 16, fontWeight: '700', color: '#63736a' },
  priceField: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: '#24362e', fontSize: 15 },
  primaryButton: { backgroundColor: '#176b52', minHeight: 48, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingTop: 12 },
  cancelText: { color: '#65746b', fontSize: 12, fontWeight: '700' },
});
