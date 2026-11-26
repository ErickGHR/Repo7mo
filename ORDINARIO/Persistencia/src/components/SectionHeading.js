import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Encabezado común para que cada parte didáctica de la pantalla se vea separada.
export default function SectionHeading({ number, title, description }) {
  return (
    <View style={styles.container}>
      <View style={styles.numberBadge}>
        <Text style={styles.number}>{number}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 24, marginBottom: 12 },
  numberBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#dcebe0', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  number: { color: '#246849', fontSize: 11, fontWeight: '900' },
  textBlock: { flex: 1 },
  title: { color: '#1d3028', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  description: { color: '#758078', fontSize: 12, lineHeight: 17, marginTop: 4 },
});
