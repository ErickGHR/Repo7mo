import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Movie } from '../../api';
import { useResource } from '../../useResource';
import { Feedback, Poster } from '../../components';
import { styles } from '../../../styles';

function Info({ label, value }: { label: string; value?: string | number | string[] }) {
  const text = Array.isArray(value) ? value.join(', ') : value;
  return <View style={styles.infoBlock}><Text style={styles.fieldLabel}>{label}</Text><Text style={styles.description}>{text || 'No disponible'}</Text></View>;
}

export default function MovieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: movie, loading, error, retry } = useResource<Movie>(`/movies/${encodeURIComponent(id || '')}`);
  if (loading || error || !movie) return <Feedback loading={loading} error={error} retry={retry} />;
  const release = movie.released ? new Date(movie.released) : null;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.detailPage}>
    <ScrollView contentContainerStyle={styles.detailBody}>
      <View style={styles.movieHero}><Poster key={movie._id} uri={movie.poster} title={movie.title} large /><View style={styles.details}>
        <Text style={styles.cardLabel}>{movie.year || 'AÑO NO DISPONIBLE'}</Text><Text style={styles.movieTitle}>{movie.title}</Text>
        <Text style={styles.description}>{movie.genres?.join(' · ') || 'Género no disponible'}</Text>
      </View></View>
      <Text style={styles.sectionTitle}>Sinopsis</Text><Text style={styles.synopsis}>{movie.fullplot || movie.plot || 'No hay descripción disponible.'}</Text>
      <Text style={styles.sectionTitle}>Ficha técnica</Text>
      <Info label="Año de estreno" value={movie.year} />
      <Info label="Fecha de estreno" value={release && !Number.isNaN(release.getTime()) ? release.toLocaleDateString('es-MX', { timeZone: 'UTC' }) : undefined} />
      <Info label="Duración" value={movie.runtime ? `${movie.runtime} minutos` : undefined} />
      <Info label="Clasificación" value={movie.rated} />
      <Info label="Calificación IMDb" value={typeof movie.imdb?.rating === 'number' ? `${movie.imdb.rating} / 10` : undefined} />
      <Text style={styles.sectionTitle}>Reparto y equipo</Text>
      <Info label="Reparto" value={movie.cast} /><Info label="Dirección" value={movie.directors} /><Info label="Guion" value={movie.writers} />
      <Info label="Países" value={movie.countries} /><Info label="Idiomas" value={movie.languages} /><Info label="Premios" value={movie.awards?.text} />
    </ScrollView>
  </SafeAreaView>;
}
