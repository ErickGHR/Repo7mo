import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Cada estado viene de App.js y cambia el mensaje de esta pieza visual.
const labels = {
  checking: 'CONECTANDO A SUPABASE…',
  connected: 'CONECTADO A SUPABASE',
  error: 'NO SE PUDO CONECTAR',
};

export default function ConnectionBanner({ status, error }) {
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        {/* El color del punto permite reconocer un error sin leer el texto. */}
        <View style={[styles.dot, status === 'error' && styles.errorDot]} />
        <Text style={[styles.label, status === 'error' && styles.errorLabel]}>
          {labels[status] ?? labels.checking}
        </Text>
      </View>
      {/* Solo mostramos el detalle cuando hay error; en éxito no ocupa espacio. */}
      {status === 'error' && error ? (
        <Text style={styles.message}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#e9ece7' },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2e9875', marginRight: 8 },
  errorDot: { backgroundColor: '#bc5547' },
  label: { color: '#477365', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  errorLabel: { color: '#a54135' },
  message: { color: '#a54135', backgroundColor: '#fff0ed', padding: 11, borderRadius: 9, fontSize: 12, marginTop: 12 },
});
