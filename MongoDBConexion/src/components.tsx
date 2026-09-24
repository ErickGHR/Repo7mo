import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from '../styles';

export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonPressed]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>;
}

export function Poster({ uri, title, large = false }: { uri?: string; title: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = large ? styles.detailPoster : styles.poster;
  return uri && !failed
    ? <Image source={{ uri }} accessibilityLabel={`Póster de ${title}`} style={size} resizeMode="cover" onError={() => setFailed(true)} />
    : <View style={[size, styles.placeholder]}><Text style={styles.placeholderIcon}>▤</Text><Text style={styles.placeholderText}>Sin póster</Text></View>;
}

export function Feedback({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  return <ScrollView contentContainerStyle={styles.centered}>
    {loading ? <><ActivityIndicator size="large" color="#1d5d50" /><Text style={styles.message}>Cargando…</Text></>
      : <><Text style={styles.stateTitle}>No pudimos cargar la información</Text><Text accessibilityRole="alert" style={styles.message}>{error}</Text><Action title="Reintentar" onPress={retry} /></>}
  </ScrollView>;
}
