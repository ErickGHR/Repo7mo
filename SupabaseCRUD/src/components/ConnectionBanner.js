import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const labels = {
  checking: 'CONECTANDO A SUPABASE…',
  connected: 'CONECTADO A SUPABASE',
  error: 'NO SE PUDO CONECTAR',
};

export default function ConnectionBanner({ status, error }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.dot, status === 'error' && styles.errorDot]} />
        <Text style={[styles.label, status === 'error' && styles.errorLabel]}>
          {labels[status] ?? labels.checking}
        </Text>
      </View>
      {status === 'error' && error ? (
        <Text style={styles.message}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2e9875', marginRight: 8 },
  errorDot: { backgroundColor: '#bc5547' },
  label: { color: '#477365', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  errorLabel: { color: '#a54135' },
  message: { color: '#a54135', backgroundColor: '#fff0ed', padding: 11, borderRadius: 9, fontSize: 12, marginBottom: 12 },
});
