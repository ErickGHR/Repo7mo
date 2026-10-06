import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import {
  FaceDetectionProvider,
  useFaceDetection,
} from '@infinitered/react-native-mlkit-face-detection';

const PEOPLE_KEY = 'face-recognition.people.v1';
const FACE_OPTIONS = {
  performanceMode: 'accurate',
  landmarkMode: true,
  classificationMode: false,
  contourMode: false,
  isTrackingEnabled: false,
};
const LANDMARKS = [
  'leftEye', 'rightEye', 'noseBase', 'leftMouth', 'rightMouth', 'bottomMouth',
  'leftCheek', 'rightCheek', 'leftEar', 'rightEar',
];
const MATCH_LIMIT = 0.16;

export default function App() {
  return (
    <FaceDetectionProvider options={FACE_OPTIONS}>
      <FaceRecognitionApp />
    </FaceDetectionProvider>
  );
}

function FaceRecognitionApp() {
  const detector = useFaceDetection();
  const camera = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [people, setPeople] = useState([]);
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PEOPLE_KEY)
      .then((value) => value && setPeople(JSON.parse(value)))
      .catch(() => Alert.alert('Error', 'No se pudo cargar el registro local.'));
  }, []);

  async function persistPeople(nextPeople) {
    setPeople(nextPeople);
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(nextPeople));
  }

  async function startCamera(nextMode) {
    setMessage('');
    setMode(nextMode);
    setCameraReady(false);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setMode(null);
        Alert.alert('Permiso necesario', 'Autoriza el acceso a la cámara para continuar.');
      }
    }
  }

  async function capture() {
    if (!camera.current || busy || !cameraReady) return;
    if (mode === 'register' && !name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre antes de registrar el rostro.');
      return;
    }
    setBusy(true);
    setMessage('Analizando rostro en el dispositivo…');
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85 });
      const result = await detector.detectFaces(photo.uri);
      const face = result?.faces?.slice().sort(
        (a, b) => b.frame.size.x * b.frame.size.y - a.frame.size.x * a.frame.size.y,
      )[0];
      const descriptor = face ? createDescriptor(face) : null;
      if (!face || !descriptor) {
        setMessage('No se detectó un rostro claro. Intenta con buena luz y mirando al frente.');
        return;
      }

      if (mode === 'register') {
        const directory = new Directory(Paths.document, 'faces');
        directory.create({ idempotent: true, intermediates: true });
        const id = `${Date.now()}`;
        const imageFile = new File(directory, `${id}.jpg`);
        new File(photo.uri).copy(imageFile);
        const person = {
          id,
          name: name.trim(),
          photoUri: imageFile.uri,
          descriptor,
          createdAt: new Date().toISOString(),
        };
        const next = [person, ...people.filter((item) => item.name.toLowerCase() !== person.name.toLowerCase())];
        await persistPeople(next);
        setName('');
        setMode(null);
        Alert.alert('Rostro registrado', `${person.name} quedó guardado en este dispositivo.`);
      } else {
        const best = people
          .map((person) => ({ person, distance: descriptorDistance(descriptor, person.descriptor) }))
          .filter((match) => Number.isFinite(match.distance))
          .sort((a, b) => a.distance - b.distance)[0];
        if (best && best.distance <= MATCH_LIMIT) {
          setMessage(`Coincidencia probable: ${best.person.name} · similitud geométrica ${formatScore(best.distance)}%.`);
        } else {
          setMessage('Rostro detectado, sin coincidencia en el registro local.');
        }
      }
    } catch (error) {
      setMessage('No se pudo analizar la imagen. Comprueba permisos y vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }

  async function removePerson(person) {
    Alert.alert('Eliminar registro', `¿Eliminar a ${person.name} y su foto del dispositivo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = people.filter((item) => item.id !== person.id);
            await persistPeople(next);
            const image = new File(person.photoUri);
            if (image.exists) image.delete();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el registro.');
          }
        },
      },
    ]);
  }

  if (mode) {
    if (!permission) return <Loading />;
    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.permissionScreen}>
          <Text style={styles.eyebrow}>FACERECOGNITION</Text>
          <Text style={styles.title}>Permite usar la cámara</Text>
          <Text style={styles.body}>La captura y el análisis del rostro se realizan en el teléfono.</Text>
          <PrimaryButton label="Dar permiso" onPress={requestPermission} />
          <TextButton label="Volver" onPress={() => setMode(null)} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.cameraScreen}>
        <View style={styles.cameraTop}>
          <Text style={styles.cameraHeading}>{mode === 'register' ? 'Registrar rostro' : 'Reconocer rostro'}</Text>
          <Pressable onPress={() => { setMode(null); setMessage(''); }} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
        {mode === 'register' && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la persona"
            placeholderTextColor="#8E968E"
            style={styles.nameInput}
            maxLength={48}
            returnKeyType="done"
          />
        )}
        <View style={styles.viewfinder}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
            onCameraReady={() => setCameraReady(true)}
            onMountError={() => setMessage('No se pudo iniciar la cámara.')}
          />
          <View pointerEvents="none" style={styles.faceGuide} />
          {!cameraReady && <ActivityIndicator style={styles.cameraLoading} color="#FFFFFF" size="large" />}
        </View>
        <Text style={styles.cameraHint}>Centra el rostro, mira al frente y busca buena iluminación.</Text>
        {message ? <Text style={styles.resultMessage}>{message}</Text> : null}
        <PrimaryButton label={busy ? 'Analizando…' : 'Tomar foto'} onPress={capture} disabled={busy || !cameraReady} />
        {busy && <ActivityIndicator color="#BCF36A" style={{ marginTop: 12 }} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5EF" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>F</Text></View>
          <Text style={styles.eyebrow}>PROYECTO MÓVIL · ANÁLISIS LOCAL</Text>
        </View>
        <Text style={styles.title}>FaceRecognition</Text>
        <Text style={styles.intro}>Registra y compara rostros directamente en tu celular. Tus fotos y datos faciales permanecen en este dispositivo.</Text>

        <View style={styles.actionCard}>
          <Text style={styles.cardEyebrow}>EMPIEZA AQUÍ</Text>
          <PrimaryButton label="Registrar una persona" onPress={() => startCamera('register')} />
          <SecondaryButton label="Reconocer un rostro" onPress={() => startCamera('recognize')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personas registradas</Text>
          <Text style={styles.count}>{people.length}</Text>
        </View>
        {people.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>Tu lista está vacía</Text>
            <Text style={styles.emptyCopy}>Registra un rostro para poder compararlo después.</Text>
          </View>
        ) : people.map((person) => (
          <View key={person.id} style={styles.personRow}>
            <Image source={{ uri: person.photoUri }} style={styles.avatar} />
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personMeta}>Guardado en este dispositivo</Text>
            </View>
            <Pressable onPress={() => removePerson(person)} hitSlop={10} accessibilityLabel={`Eliminar a ${person.name}`}>
              <Text style={styles.removeText}>Eliminar</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Acerca del reconocimiento</Text>
          <Text style={styles.noteCopy}>La detección usa ML Kit en el dispositivo. La comparación de esta práctica usa proporciones de puntos faciales; puede fallar con cambios de ángulo o expresión y no sirve para verificar identidad ni controlar acceso.</Text>
        </View>
        <Text style={styles.footer}>SIN CUENTA · SIN SERVIDOR · DATOS LOCALES</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createDescriptor(face) {
  const { origin, size } = face.frame;
  if (!size?.x || !size?.y) return null;
  const byType = Object.fromEntries(
    (face.landmarks ?? [])
      .filter((point) => point.type && point.position)
      .map((point) => [point.type, point.position]),
  );
  const descriptor = {};
  for (const type of LANDMARKS) {
    const point = byType[type];
    if (point) descriptor[type] = [
      (point.x - origin.x) / size.x,
      (point.y - origin.y) / size.y,
    ];
  }
  return Object.keys(descriptor).length >= 4 ? descriptor : null;
}

function descriptorDistance(first, second) {
  if (!first || !second) return Infinity;
  const common = LANDMARKS.filter((key) => first[key] && second[key]);
  if (common.length < 4) return Infinity;
  const squared = common.reduce((sum, key) => {
    const dx = first[key][0] - second[key][0];
    const dy = first[key][1] - second[key][1];
    return sum + dx * dx + dy * dy;
  }, 0);
  return Math.sqrt(squared / common.length);
}

function formatScore(distance) {
  return Math.max(0, Math.round((1 - distance / 0.38) * 100));
}

function Loading() {
  return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color="#355E43" /></SafeAreaView>;
}

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Text style={styles.buttonArrow}>↗</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text><Text style={styles.secondaryArrow}>↗</Text></Pressable>;
}

function TextButton({ label, onPress }) {
  return <Pressable onPress={onPress} style={styles.textButton}><Text style={styles.textButtonLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5EF' },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 38 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 },
  brandMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#355E43', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#D8FF93', fontWeight: '800', fontSize: 18 },
  eyebrow: { color: '#567260', letterSpacing: 1.3, fontSize: 10, fontWeight: '800' },
  title: { color: '#1E3024', fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.2 },
  intro: { color: '#66746A', fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 24 },
  actionCard: { backgroundColor: '#E6EBDD', borderRadius: 22, padding: 18, gap: 10, marginBottom: 29 },
  cardEyebrow: { color: '#647566', letterSpacing: 1.2, fontWeight: '800', fontSize: 10, marginBottom: 2 },
  primaryButton: { backgroundColor: '#355E43', borderRadius: 15, paddingVertical: 16, paddingHorizontal: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  buttonArrow: { color: '#D8FF93', fontSize: 18, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F9FAF6', borderWidth: 1, borderColor: '#D8DED2', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryButtonText: { color: '#304A37', fontSize: 15, fontWeight: '700' },
  secondaryArrow: { color: '#64836A', fontSize: 18 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.48 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { color: '#25362A', fontSize: 19, fontWeight: '700' },
  count: { overflow: 'hidden', color: '#58725B', backgroundColor: '#E3E9DF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, fontWeight: '700' },
  emptyCard: { borderWidth: 1, borderColor: '#DDE2D8', borderStyle: 'dashed', borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 22 },
  emptyIcon: { color: '#8AA28B', fontSize: 30, marginBottom: 7 },
  emptyTitle: { color: '#3A4A3E', fontWeight: '700', fontSize: 15 },
  emptyCopy: { color: '#7A857C', fontSize: 13, textAlign: 'center', marginTop: 5, lineHeight: 19 },
  personRow: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 11, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#E6EBDD' },
  personDetails: { flex: 1 },
  personName: { color: '#29382D', fontWeight: '700', fontSize: 15 },
  personMeta: { color: '#7A857C', fontSize: 11, marginTop: 4 },
  removeText: { color: '#A04D42', fontSize: 12, fontWeight: '700', padding: 5 },
  noteCard: { backgroundColor: '#ECEEE8', borderRadius: 17, padding: 16, marginTop: 15 },
  noteTitle: { color: '#3A4A3E', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  noteCopy: { color: '#69756C', fontSize: 12, lineHeight: 18 },
  footer: { color: '#96A097', fontSize: 9, letterSpacing: 1.1, textAlign: 'center', fontWeight: '700', marginTop: 24 },
  cameraScreen: { flex: 1, backgroundColor: '#1D2921', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 },
  cameraTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  cameraHeading: { color: '#F3F6EF', fontSize: 21, fontWeight: '700' },
  closeButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#334138' },
  closeText: { color: '#DFE8DD', fontSize: 13, fontWeight: '600' },
  nameInput: { backgroundColor: '#F7F8F4', borderRadius: 13, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, marginBottom: 14, color: '#25362A' },
  viewfinder: { width: '100%', flex: 1, minHeight: 350, maxHeight: 570, overflow: 'hidden', borderRadius: 25, backgroundColor: '#26342B' },
  faceGuide: { position: 'absolute', width: '68%', height: '69%', alignSelf: 'center', top: '13%', borderWidth: 2, borderColor: 'rgba(216,255,147,0.9)', borderRadius: 180 },
  cameraLoading: { flex: 1 },
  cameraHint: { color: '#D1D9CF', fontSize: 13, textAlign: 'center', lineHeight: 20, marginVertical: 15 },
  resultMessage: { color: '#D8FF93', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 21, marginBottom: 13 },
  permissionScreen: { flex: 1, backgroundColor: '#F4F5EF', padding: 24, justifyContent: 'center', gap: 16 },
  body: { color: '#66746A', fontSize: 15, lineHeight: 23 },
  textButton: { alignItems: 'center', padding: 12 },
  textButtonLabel: { color: '#355E43', fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F5EF' },
});
