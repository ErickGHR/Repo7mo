import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Movie } from '../api';
import { useSession } from '../session';
import { useResource } from '../useResource';
import { Action, Feedback, Poster } from '../components';
import { styles } from '../../styles';

export default function Catalog() {
  const { session, signOut } = useSession();
  const { data, error, loading, retry } = useResource<Movie[]>('/movies');
  const [logoutError, setLogoutError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setLogoutError('');
    try { await signOut(); } catch { setLogoutError('No se pudo cerrar sesión. Vuelve a intentar.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <View style={styles.accountRow}><Text style={styles.brand}>CINE / EXPLORA</Text><Action title={busy ? 'Saliendo…' : 'Cerrar sesión'} onPress={logout} disabled={busy} /></View>
      <Text style={styles.heading}>Una historia más.</Text>
      <Text style={styles.subtitle}>Bienvenido, {session?.username}.</Text>
      {logoutError ? <Text style={styles.logoutError} accessibilityRole="alert">{logoutError}</Text> : null}
    </View>
    <View style={styles.content}>
      {loading || error ? <Feedback loading={loading} error={error} retry={retry} /> : <FlatList
        data={data || []} keyExtractor={(item) => item._id} contentContainerStyle={styles.list}
        ListHeaderComponent={<View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Explora el catálogo</Text><Text style={styles.sectionLabel}>{data?.length || 0} PELÍCULAS</Text></View>}
        ListEmptyComponent={<Text style={styles.message}>No hay películas. Carga sample_mflix en tu clúster de Atlas.</Text>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${item.title}`} onPress={() => router.push({ pathname: '/movies/[id]', params: { id: item._id } })} style={({ pressed }) => [styles.card, pressed && styles.buttonPressed]}>
          <Poster uri={item.poster} title={item.title} />
          <View style={styles.details}>
            <Text style={styles.cardLabel}>{item.year || 'AÑO NO DISPONIBLE'}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={3}>{item.plot || 'Abre la ficha para conocer más.'}</Text>
            <Text style={styles.detailLink}>Ver película →</Text>
          </View>
        </Pressable>} />}
    </View>
  </SafeAreaView>;
}
