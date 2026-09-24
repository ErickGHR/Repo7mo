import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '../session';

function Navigator() {
  const { session } = useSession();
  return <><StatusBar style="light" /><Stack screenOptions={{ headerStyle: { backgroundColor: '#142b2b' }, headerTintColor: '#fffdf5', contentStyle: { backgroundColor: '#f5f4ef' } }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={!!session}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="movies/[id]" options={{ title: 'Detalle de la película', headerBackTitle: 'Catálogo' }} />
    </Stack.Protected>
  </Stack></>;
}

export default function Layout() { return <SessionProvider><Navigator /></SessionProvider>; }
