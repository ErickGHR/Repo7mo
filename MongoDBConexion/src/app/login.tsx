import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../session';
import { Action } from '../components';
import { styles } from '../../styles';

export default function Login() {
  const { signIn } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    if (!username.trim() || !password) { setError('Escribe tu usuario y contraseña.'); return; }
    setBusy(true); setError('');
    try { await signIn(username.trim(), password); setPassword(''); }
    catch (caught) { setPassword(''); setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandIcon}>▶</Text></View><Text style={styles.brand}>CINE / EXPLORA</Text></View>
        <Text style={styles.heading}>Tu entrada al cine.</Text>
        <Text style={styles.subtitle}>Inicia sesión para descubrir historias y conocer a quienes las hicieron posibles.</Text>
        <View style={styles.loginCard}>
          <Text style={styles.sectionTitle}>Iniciar sesión</Text>
          <Text style={styles.formHelp}>Usa tu usuario de base de datos de MongoDB Atlas.</Text>
          <Text style={styles.fieldLabel}>Usuario</Text>
          <TextInput accessibilityLabel="Usuario" autoCapitalize="none" autoCorrect={false} autoComplete="username" value={username} onChangeText={setUsername} editable={!busy} style={styles.input} placeholder="Tu usuario de MongoDB" placeholderTextColor="#7c8982" returnKeyType="next" />
          <Text style={styles.fieldLabel}>Contraseña</Text>
          <TextInput accessibilityLabel="Contraseña" secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" value={password} onChangeText={setPassword} editable={!busy} style={styles.input} placeholder="Tu contraseña" placeholderTextColor="#7c8982" onSubmitEditing={submit} returnKeyType="go" />
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          <Action title={busy ? 'Validando acceso…' : 'Entrar al catálogo'} onPress={submit} disabled={busy} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
