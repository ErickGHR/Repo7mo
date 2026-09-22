import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, Pressable, Platform, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styles } from './styles';

/** @typedef {{ _id: string, title: string, fullplot?: string, plot?: string, poster?: string }} Movie */

function getApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  // Expo Go publica la dirección de la computadora que ejecuta Metro.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${new URL(`http://${hostUri}`).hostname}:3000`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

/** @param {{ item: Movie }} props */
function MovieCard({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={styles.card}>
      {item.poster && !imageFailed ? (
        <Image
          source={{ uri: item.poster }}
          style={styles.poster}
          resizeMode="cover"
          accessibilityLabel={`Póster de ${item.title}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.poster, styles.placeholder]}>
          <Text style={styles.placeholderIcon}>▤</Text>
          <Text style={styles.placeholderText}>Sin póster</Text>
        </View>
      )}
      <View style={styles.details}>
        <Text style={styles.cardLabel}>PELÍCULA</Text>
        <Text style={styles.title}>{item.title || 'Sin título'}</Text>
        <Text style={styles.description}>{item.fullplot || item.plot || 'Sin descripción'}</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [movies, setMovies] = useState(/** @type {Movie[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadMovies() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${getApiUrl()}/movies`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`El servidor respondió con un error (${response.status}). Revisa la conexión a MongoDB.`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.some((movie) => !movie || typeof movie._id !== 'string' || typeof movie.title !== 'string')) {
          throw new Error('El servidor no devolvió una lista válida de películas.');
        }
        if (active) setMovies(data);
      } catch (caught) {
        if (active) {
          const message = caught instanceof Error ? caught.message : '';
          setError(controller.signal.aborted
            ? 'La conexión tardó demasiado. Comprueba que el servidor esté encendido y vuelve a intentar.'
            : message.startsWith('El servidor')
              ? message
              : 'No se pudo conectar al servidor. Revisa que esté encendido y que el celular y la computadora estén en la misma red.');
        }
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    loadMovies();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandIcon}>▶</Text></View>
            <Text style={styles.brand}>CINE / EXPLORA</Text>
          </View>
          <Text style={styles.heading}>Una historia más.</Text>
          <Text style={styles.subtitle}>Tu próxima película empieza aquí.</Text>
          <View style={styles.badge}>
            <View style={[styles.statusDot, error ? styles.statusError : null]} />
            <Text style={styles.badgeText}>{loading ? 'Conectando con el catálogo' : error ? 'Conexión pendiente' : `${movies.length} películas para descubrir`}</Text>
          </View>
        </View>
        <View style={styles.content}>
        {loading ? (
          <ScrollView contentContainerStyle={styles.centered}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.message}>Cargando películas…</Text>
          </ScrollView>
        ) : error ? (
          <ScrollView contentContainerStyle={styles.centered}>
            <Text style={styles.stateTitle}>No pudimos cargar el catálogo</Text>
            <Text style={styles.message} accessibilityRole="alert">{error}</Text>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => setAttempt((value) => value + 1)}>
              <Text style={styles.buttonText}>Reintentar conexión</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <FlatList
            data={movies}
            renderItem={({ item }) => <MovieCard item={item} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Explora el catálogo</Text><Text style={styles.sectionLabel}>PARA TI</Text></View>}
            ListEmptyComponent={<Text style={styles.message}>No hay películas en la colección movies.</Text>}
          />
        )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
