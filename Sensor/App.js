import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Accelerometer, Gyroscope, Magnetometer } from "expo-sensors";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});

const COLORS = {
  bg: "#07111F",
  panel: "#101E30",
  panelLight: "#15263B",
  line: "#22364D",
  text: "#F4F7FB",
  muted: "#91A3B8",
  cyan: "#48D7C5",
  blue: "#70A7FF",
  amber: "#FFC46B",
  pink: "#FF8EA1",
};

const ITEMS = [
  { id: "inicio", icon: "⌂", title: "Inicio", subtitle: "Panel de sensores", color: COLORS.cyan },
  { id: "acelerometro", icon: "↗", title: "Acelerómetro", subtitle: "Movimiento y gravedad", color: COLORS.blue },
  { id: "giroscopio", icon: "⟳", title: "Giroscopio", subtitle: "Rotación en 3 ejes", color: COLORS.pink },
  { id: "gps", icon: "◎", title: "GPS", subtitle: "Ubicación del dispositivo", color: COLORS.amber },
  { id: "magnetometro", icon: "✳", title: "Magnetómetro", subtitle: "Campo magnético y brújula", color: COLORS.cyan },
  { id: "investigacion", icon: "▤", title: "Investigación", subtitle: "Conceptos y funcionamiento", color: COLORS.blue },
];

const SENSOR_INFO = {
  acelerometro: {
    title: "Acelerómetro", eyebrow: "MOVIMIENTO · m/s²", color: COLORS.blue,
    description: "Mide la aceleración del teléfono en los ejes X, Y y Z. Incluye la gravedad cuando el dispositivo está quieto.",
    unit: "g", Component: Accelerometer,
  },
  giroscopio: {
    title: "Giroscopio", eyebrow: "VELOCIDAD ANGULAR · rad/s", color: COLORS.pink,
    description: "Registra qué tan rápido gira el dispositivo alrededor de cada eje. La lectura vuelve cerca de cero cuando deja de rotar.",
    unit: "rad/s", Component: Gyroscope,
  },
  magnetometro: {
    title: "Magnetómetro", eyebrow: "CAMPO MAGNÉTICO · µT", color: COLORS.cyan,
    description: "Detecta el campo magnético en tres ejes. Con esos valores calculamos una orientación aproximada de brújula.",
    unit: "µT", Component: Magnetometer,
  },
};

export default function App() {
  const [screen, setScreen] = useState("inicio");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const navigate = (id) => {
    setScreen(id);
    setDrawerOpen(false);
  };

  if (!ready) return null;

  const current = ITEMS.find((item) => item.id === screen) || ITEMS[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.app}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
            <Text style={styles.menuGlyph}>☰</Text>
          </Pressable>
          <View style={styles.brandMark}><Text style={styles.brandGlyph}>⌁</Text></View>
          <View style={styles.brandText}><Text style={styles.brandName}>PULSO</Text><Text style={styles.brandCaption}>LABORATORIO MÓVIL</Text></View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LISTO</Text></View>
        </View>

        <View style={styles.screenBar}>
          <Text style={[styles.screenIcon, { color: current.color }]}>{current.icon}</Text>
          <Text style={styles.screenTitle}>{current.title}</Text>
          <Text style={styles.screenIndex}>{String(ITEMS.findIndex((item) => item.id === screen) + 1).padStart(2, "0")}</Text>
        </View>

        {screen === "inicio" && <HomeScreen onNavigate={navigate} />}
        {SENSOR_INFO[screen] && <SensorScreen key={screen} config={SENSOR_INFO[screen]} />}
        {screen === "gps" && <GpsScreen />}
        {screen === "investigacion" && <ResearchScreen onNavigate={navigate} />}

        {drawerOpen && (
          <View style={styles.drawerLayer}>
            <Pressable style={styles.scrim} onPress={() => setDrawerOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerLogo}><Text style={styles.drawerLogoText}>⌁</Text></View>
                <Text style={styles.drawerBrand}>PULSO</Text>
                <Text style={styles.drawerTagline}>Explora lo invisible.</Text>
                <View style={styles.drawerRule} />
                <Text style={styles.drawerSection}>EXPLORACIÓN</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {ITEMS.map((item, index) => (
                  <Pressable key={item.id} onPress={() => navigate(item.id)} style={[styles.drawerItem, screen === item.id && styles.drawerItemActive]}>
                    <Text style={[styles.drawerItemIcon, { color: item.color }]}>{item.icon}</Text>
                    <View style={styles.drawerItemText}><Text style={[styles.drawerItemTitle, screen === item.id && styles.drawerSelectedText]}>{item.title}</Text><Text style={styles.drawerItemSubtitle}>{item.subtitle}</Text></View>
                    <Text style={styles.drawerNumber}>{String(index + 1).padStart(2, "0")}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.drawerFooter}><View style={styles.liveDot} /><Text style={styles.drawerFooterText}>ANDROID SENSOR LAB · v1.0</Text></View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Page({ children, contentStyle }) {
  return <ScrollView style={styles.page} contentContainerStyle={[styles.pageContent, contentStyle]} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function HomeScreen({ onNavigate }) {
  return (
    <Page>
      <View style={styles.hero}>
        <View style={styles.heroOrb}><View style={styles.orbRing} /><View style={styles.orbDot} /><Text style={styles.orbGlyph}>⌁</Text></View>
        <Text style={styles.eyebrow}>CENTRO DE INSTRUMENTOS <Text style={{ color: COLORS.cyan }}>· 04</Text></Text>
        <Text style={styles.heroTitle}>Tu teléfono{ "\n" }<Text style={{ color: COLORS.cyan }}>lo siente todo.</Text></Text>
        <Text style={styles.heroBody}>Explora el movimiento, la orientación y tu posición en tiempo real.</Text>
        <View style={styles.heroMeta}><View style={styles.liveDot} /><Text style={styles.heroMetaText}>SENSORES LISTOS PARA EXPLORAR</Text></View>
      </View>
      <SectionLabel>ELIGE UN INSTRUMENTO</SectionLabel>
      <View style={styles.instrumentList}>
        {ITEMS.filter((item) => ["acelerometro", "giroscopio", "gps", "magnetometro"].includes(item.id)).map((item, index) => (
          <Pressable key={item.id} onPress={() => onNavigate(item.id)} style={({ pressed }) => [styles.instrumentCard, pressed && styles.pressed]}>
            <View style={[styles.instrumentIcon, { backgroundColor: `${item.color}18` }]}><Text style={[styles.instrumentGlyph, { color: item.color }]}>{item.icon}</Text></View>
            <View style={styles.instrumentInfo}><Text style={styles.instrumentTitle}>{item.title}</Text><Text style={styles.instrumentSubtitle}>{item.subtitle}</Text></View>
            <View style={styles.instrumentArrow}><Text style={styles.arrowText}>↗</Text></View>
            <View style={[styles.instrumentAccent, { backgroundColor: item.color }]} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => onNavigate("investigacion")} style={styles.researchLink}><Text style={styles.researchIcon}>▤</Text><Text style={styles.researchText}>¿Cómo funcionan estos sensores?</Text><Text style={styles.researchArrow}>→</Text></Pressable>
      <Text style={styles.footerNote}>Mueve tu dispositivo para observar los cambios · los datos se procesan localmente.</Text>
    </Page>
  );
}

function SensorScreen({ config }) {
  const [values, setValues] = useState({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState(true);
  const { Component, color, title, eyebrow, description, unit } = config;

  useEffect(() => {
    let subscription;
    let active = true;
    Component.isAvailableAsync().then((ok) => {
      if (!active) return;
      setAvailable(ok);
      if (ok) {
        Component.setUpdateInterval(100);
        subscription = Component.addListener((measurement) => setValues(measurement));
      }
    }).catch(() => setAvailable(false));
    return () => { active = false; subscription?.remove(); };
  }, [Component]);

  const heading = title === "Magnetómetro" ? bearing(values.x, values.y) : null;
  return (
    <Page>
      <View style={[styles.sensorHero, { borderColor: `${color}45` }]}>
        <View style={styles.sensorHeroTop}><View style={[styles.sensorHeroIcon, { backgroundColor: `${color}18` }]}><Text style={{ color, fontSize: 26 }}>{title === "Acelerómetro" ? "↗" : title === "Giroscopio" ? "⟳" : "✳"}</Text></View><View style={[styles.sensorLive, { borderColor: `${color}55` }]}><View style={[styles.liveDot, { backgroundColor: color }]} /><Text style={[styles.sensorLiveText, { color }]}>{available ? "EN VIVO" : "NO DISPONIBLE"}</Text></View></View>
        <Text style={styles.sensorEyebrow}>{eyebrow}</Text>
        <Text style={styles.sensorHeadline}>{title === "Acelerómetro" ? "Siente cada movimiento." : title === "Giroscopio" ? "Rota. El teléfono lo sabe." : "Encuentra tu norte."}</Text>
        <Text style={styles.sensorDescription}>{description}</Text>
      </View>
      {heading !== null && <View style={styles.compassCard}><View style={styles.compassRing}><Text style={[styles.compassCardinal, styles.north]}>N</Text><Text style={[styles.compassCardinal, styles.east]}>E</Text><Text style={[styles.compassCardinal, styles.south]}>S</Text><Text style={[styles.compassCardinal, styles.west]}>O</Text><View style={[styles.compassNeedle, { transform: [{ rotate: `${heading}deg` }] }]}><View style={styles.needleNorth} /><View style={styles.needleSouth} /></View><View style={styles.compassCenter} /></View><View style={styles.headingInfo}><Text style={styles.headingDegrees}>{Math.round(heading)}°</Text><Text style={styles.headingDirection}>{directionName(heading)}</Text><Text style={styles.headingCaption}>RUMBO APROXIMADO</Text></View></View>}
      <SectionLabel>LECTURA EN TIEMPO REAL</SectionLabel>
      <View style={styles.readingGrid}>{["x", "y", "z"].map((axis) => <View key={axis} style={styles.readingCard}><View style={styles.readingTop}><Text style={styles.readingAxis}>{axis.toUpperCase()}</Text><View style={[styles.axisDot, { backgroundColor: color }]} /></View><Text style={styles.readingValue}>{values[axis].toFixed(2)}</Text><Text style={styles.readingUnit}>{unit}</Text><View style={styles.meterTrack}><View style={[styles.meterBar, { width: `${Math.min(100, Math.abs(values[axis]) * (title === "Acelerómetro" ? 40 : 10))}%`, backgroundColor: color }]} /></View></View>)}</View>
      {!available && <View style={styles.notice}><Text style={styles.noticeText}>Este dispositivo no reporta este sensor.</Text></View>}
      <View style={styles.noteCard}><Text style={styles.noteLabel}>QUÉ ESTÁS VIENDO</Text><Text style={styles.noteBody}>{title === "Acelerómetro" ? "Las lecturas se expresan en múltiplos de g: un teléfono quieto suele mostrar cerca de 1 g en el eje vertical por la gravedad." : title === "Giroscopio" ? "Los valores indican velocidad angular. Gira suavemente el móvil y observa cómo cambia cada eje; en reposo se acercan a cero." : "El norte se estima con atan2(Y, X). Los campos magnéticos cercanos al teléfono pueden alterar la lectura."}</Text></View>
      <View style={styles.sourceLine}><Text style={styles.sourceDot}>●</Text><Text style={styles.sourceText}>Expo Sensors · actualización cada 100 ms</Text></View>
    </Page>
  );
}

function bearing(x, y) {
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function directionName(degrees) {
  return ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"][Math.round(degrees / 45) % 8];
}

function GpsScreen() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Solicita una lectura para encontrar tu posición.");
  const [accuracy, setAccuracy] = useState(null);
  const watchRef = useRef(null);
  useEffect(() => () => watchRef.current?.remove(), []);

  const locate = async () => {
    setStatus("loading"); setMessage("Buscando señal de ubicación…");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setStatus("denied"); setMessage("Permiso denegado. Activa ubicación para esta app en Ajustes."); return; }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) { setStatus("error"); setMessage("Activa los servicios de ubicación del dispositivo e inténtalo de nuevo."); return; }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(result.coords); setAccuracy(result.coords.accuracy); setStatus("success"); setMessage("Posición actualizada correctamente.");
    } catch {
      setStatus("error"); setMessage("No se pudo obtener la ubicación. Prueba al aire libre o revisa el GPS.");
    }
  };

  return (
    <Page>
      <View style={[styles.sensorHero, { borderColor: `${COLORS.amber}45` }]}>
        <View style={styles.sensorHeroTop}><View style={[styles.sensorHeroIcon, { backgroundColor: `${COLORS.amber}18` }]}><Text style={{ color: COLORS.amber, fontSize: 28 }}>◎</Text></View><View style={[styles.sensorLive, { borderColor: `${COLORS.amber}55` }]}><View style={[styles.liveDot, { backgroundColor: status === "success" ? COLORS.cyan : COLORS.amber }]} /><Text style={[styles.sensorLiveText, { color: COLORS.amber }]}>{status === "success" ? "LOCALIZADO" : "GPS"}</Text></View></View>
        <Text style={styles.sensorEyebrow}>POSICIÓN · COORDENADAS</Text><Text style={styles.sensorHeadline}>¿Dónde estás ahora?</Text><Text style={styles.sensorDescription}>El GPS obtiene tu posición con ayuda de satélites y servicios de ubicación. La app sólo la solicita cuando tocas el botón.</Text>
      </View>
      <View style={styles.gpsVisual}><View style={styles.mapGrid} /><View style={styles.mapRoute}><View style={styles.routeNode} /><View style={styles.routeDash} /><View style={styles.routePin}><Text style={styles.routePinGlyph}>●</Text></View></View><Text style={styles.mapCaption}>LECTURA DE UBICACIÓN</Text></View>
      <Pressable onPress={locate} disabled={status === "loading"} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, status === "loading" && { opacity: 0.7 }]}>{status === "loading" ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.primaryButtonIcon}>◎</Text>}<Text style={styles.primaryButtonText}>{status === "loading" ? "Localizando…" : "Obtener mi ubicación"}<Text style={styles.primaryButtonArrow}>  →</Text></Text></Pressable>
      <Text style={[styles.locationMessage, status === "error" || status === "denied" ? { color: COLORS.amber } : {}]}>{message}</Text>
      {location && <><SectionLabel>COORDENADAS ACTUALES</SectionLabel><View style={styles.coordinateCard}><Coordinate label="LATITUD" value={location.latitude.toFixed(6)} /><View style={styles.coordinateDivider} /><Coordinate label="LONGITUD" value={location.longitude.toFixed(6)} /></View><View style={styles.accuracyCard}><View><Text style={styles.noteLabel}>PRECISIÓN ESTIMADA</Text><Text style={styles.accuracyValue}>{accuracy == null ? "—" : `±${Math.round(accuracy)} m`}</Text></View><Text style={styles.accuracyIcon}>⌖</Text></View></>}
      <View style={styles.noteCard}><Text style={styles.noteLabel}>CÓMO FUNCIONA</Text><Text style={styles.noteBody}>El receptor combina señales satelitales para estimar latitud y longitud. La precisión depende del cielo visible, el entorno y la señal disponible. Esta demo usa ubicación en primer plano.</Text></View>
      <View style={styles.sourceLine}><Text style={styles.sourceDot}>●</Text><Text style={styles.sourceText}>Expo Location · permiso al usar la demo</Text></View>
    </Page>
  );
}

function Coordinate({ label, value }) {
  return <View style={styles.coordinate}><Text style={styles.coordinateLabel}>{label}</Text><Text style={styles.coordinateValue}>{value}</Text></View>;
}

function ResearchScreen({ onNavigate }) {
  const topics = [
    { id: "acelerometro", number: "01", title: "Acelerómetro", unit: "m/s² · aceleración", body: "Mide cambios de velocidad en los tres ejes. También registra la gravedad, por eso un móvil inmóvil aún presenta una lectura cercana a 9.8 m/s² en vertical." },
    { id: "giroscopio", number: "02", title: "Giroscopio", unit: "rad/s · rotación", body: "Mide la velocidad angular alrededor de los ejes X, Y y Z. Es útil para detectar giros y estabilizar movimiento; integra el giro y puede acumular error con el tiempo." },
    { id: "gps", number: "03", title: "GPS", unit: "latitud · longitud · metros", body: "Calcula la posición a partir de señales de satélites y otros proveedores del sistema. La precisión cambia con el entorno, el cielo visible y la calidad de la señal." },
    { id: "magnetometro", number: "04", title: "Magnetómetro", unit: "µT · campo magnético", body: "Mide la intensidad del campo magnético en tres ejes. Junto con otros sensores permite estimar orientación; imanes y objetos metálicos cercanos pueden distorsionarla." },
  ];
  return <Page><View style={styles.researchHero}><Text style={styles.eyebrow}>GUÍA RÁPIDA · ANDROID</Text><Text style={styles.heroTitle}>Pequeños sensores.{"\n"}<Text style={{ color: COLORS.cyan }}>Grandes señales.</Text></Text><Text style={styles.heroBody}>Android ofrece acceso a sensores físicos y servicios de ubicación mediante APIs del sistema.</Text></View><SectionLabel>QUÉ MIDE CADA UNO</SectionLabel>{topics.map((topic) => <Pressable key={topic.id} onPress={() => onNavigate(topic.id)} style={styles.topicCard}><View style={styles.topicTop}><Text style={styles.topicNumber}>{topic.number}</Text><Text style={styles.topicUnit}>{topic.unit}</Text><Text style={styles.topicArrow}>↗</Text></View><Text style={styles.topicTitle}>{topic.title}</Text><Text style={styles.topicBody}>{topic.body}</Text></Pressable>)}<View style={styles.noteCard}><Text style={styles.noteLabel}>BUENAS PRÁCTICAS</Text><Text style={styles.noteBody}>Solicita permisos sólo cuando se necesitan. Registra sensores en primer plano y elimina las suscripciones al cerrar cada pantalla para cuidar batería y privacidad.</Text></View><Text style={styles.citation}>Referencias técnicas: Android Developers · Sensors overview; Expo SDK 57 · Expo Sensors y Expo Location.</Text></Page>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, app: { flex: 1, backgroundColor: COLORS.bg },
  topbar: { height: 72, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#19283A" },
  menuButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: 10 }, menuGlyph: { color: COLORS.text, fontSize: 23 },
  brandMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.cyan, alignItems: "center", justifyContent: "center" }, brandGlyph: { color: COLORS.bg, fontSize: 24, fontWeight: "800", marginTop: -4 },
  brandText: { marginLeft: 10 }, brandName: { color: COLORS.text, fontSize: 14, letterSpacing: 3.5, fontWeight: "900" }, brandCaption: { color: COLORS.muted, fontSize: 8, letterSpacing: 1.2, marginTop: 2 },
  livePill: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#112B2D", borderWidth: 1, borderColor: "#204443" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.cyan }, liveText: { color: COLORS.cyan, fontSize: 9, letterSpacing: 1.1, fontWeight: "800" },
  screenBar: { height: 48, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#142237", gap: 9 }, screenIcon: { fontSize: 18 }, screenTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700" }, screenIndex: { marginLeft: "auto", color: "#60738A", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  page: { flex: 1 }, pageContent: { padding: 22, paddingBottom: 36 }, eyebrow: { color: COLORS.muted, letterSpacing: 1.7, fontSize: 9, fontWeight: "800" },
  hero: { backgroundColor: COLORS.panel, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, padding: 22, paddingTop: 20, marginBottom: 28, overflow: "hidden" }, heroOrb: { height: 120, alignItems: "center", justifyContent: "center", marginBottom: 14 }, orbRing: { position: "absolute", width: 112, height: 112, borderWidth: 1, borderColor: "#31535E", borderRadius: 56 }, orbDot: { position: "absolute", width: 78, height: 78, borderWidth: 1, borderColor: "#27564F", borderRadius: 39 }, orbGlyph: { color: COLORS.cyan, fontSize: 76, fontWeight: "300", marginTop: -12 }, heroTitle: { color: COLORS.text, fontSize: 31, lineHeight: 37, fontWeight: "800", letterSpacing: -0.9, marginTop: 14 }, heroBody: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 10 }, heroMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 21, paddingTop: 15, borderTopWidth: 1, borderColor: COLORS.line }, heroMetaText: { color: COLORS.cyan, fontSize: 9, letterSpacing: 1.1, fontWeight: "700" },
  sectionLabel: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.6, fontWeight: "800", marginBottom: 12 }, instrumentList: { gap: 10 }, instrumentCard: { height: 78, backgroundColor: COLORS.panel, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, overflow: "hidden" }, instrumentIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" }, instrumentGlyph: { fontSize: 25 }, instrumentInfo: { marginLeft: 12, flex: 1 }, instrumentTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" }, instrumentSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 }, instrumentArrow: { width: 28, height: 28, borderRadius: 9, backgroundColor: COLORS.panelLight, alignItems: "center", justifyContent: "center" }, arrowText: { color: COLORS.muted, fontSize: 15 }, instrumentAccent: { position: "absolute", left: 0, top: 19, bottom: 19, width: 2, borderTopRightRadius: 2, borderBottomRightRadius: 2 }, pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  researchLink: { flexDirection: "row", alignItems: "center", padding: 15, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, marginTop: 20 }, researchIcon: { color: COLORS.blue, fontSize: 17, marginRight: 11 }, researchText: { color: COLORS.text, fontSize: 11, flex: 1 }, researchArrow: { color: COLORS.cyan, fontSize: 18 }, footerNote: { color: "#64778C", fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 20 },
  drawerLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10, flexDirection: "row" }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" }, drawer: { width: "84%", maxWidth: 350, backgroundColor: "#0B1726", borderRightWidth: 1, borderColor: COLORS.line, paddingHorizontal: 18, paddingTop: 25, paddingBottom: 15 }, drawerHeader: { paddingHorizontal: 8 }, drawerLogo: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.cyan, alignItems: "center", justifyContent: "center" }, drawerLogoText: { color: COLORS.bg, fontSize: 30, fontWeight: "800", marginTop: -5 }, drawerBrand: { color: COLORS.text, fontSize: 18, letterSpacing: 4, fontWeight: "900", marginTop: 16 }, drawerTagline: { color: COLORS.muted, fontSize: 11, marginTop: 4 }, drawerRule: { height: 1, backgroundColor: COLORS.line, marginTop: 22, marginBottom: 18 }, drawerSection: { color: "#63768C", fontSize: 9, letterSpacing: 1.8, fontWeight: "800", marginBottom: 10 }, drawerItem: { minHeight: 62, borderRadius: 13, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, marginVertical: 3 }, drawerItemActive: { backgroundColor: "#14273A", borderWidth: 1, borderColor: "#284354" }, drawerItemIcon: { width: 31, fontSize: 21 }, drawerItemText: { flex: 1 }, drawerItemTitle: { color: "#CED7E2", fontSize: 12, fontWeight: "700" }, drawerSelectedText: { color: COLORS.cyan }, drawerItemSubtitle: { color: "#71849A", fontSize: 9, marginTop: 3 }, drawerNumber: { color: "#51647A", fontSize: 9 }, drawerFooter: { borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 15, paddingHorizontal: 5, flexDirection: "row", alignItems: "center", gap: 8 }, drawerFooterText: { color: "#77899C", fontSize: 8, letterSpacing: 1 },
  sensorHero: { backgroundColor: COLORS.panel, borderWidth: 1, borderRadius: 22, padding: 19, marginBottom: 23 }, sensorHeroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 19 }, sensorHeroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }, sensorLive: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 9 }, sensorLiveText: { fontSize: 8, letterSpacing: 1.2, fontWeight: "800" }, sensorEyebrow: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.4, fontWeight: "800" }, sensorHeadline: { color: COLORS.text, fontSize: 24, lineHeight: 30, fontWeight: "800", marginTop: 9, letterSpacing: -0.4 }, sensorDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 19, marginTop: 8 }, readingGrid: { flexDirection: "row", gap: 9, marginBottom: 18 }, readingCard: { flex: 1, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 12 }, readingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, readingAxis: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, axisDot: { width: 5, height: 5, borderRadius: 3 }, readingValue: { color: COLORS.text, fontSize: 20, fontWeight: "800", marginTop: 14, fontVariant: ["tabular-nums"] }, readingUnit: { color: COLORS.muted, fontSize: 9, marginTop: 3 }, meterTrack: { height: 3, backgroundColor: "#26374B", borderRadius: 2, marginTop: 13, overflow: "hidden" }, meterBar: { height: 3, borderRadius: 2 }, noteCard: { padding: 15, backgroundColor: "#0D1928", borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, marginTop: 5 }, noteLabel: { color: COLORS.cyan, fontSize: 8, letterSpacing: 1.4, fontWeight: "800" }, noteBody: { color: COLORS.muted, fontSize: 11, lineHeight: 18, marginTop: 8 }, sourceLine: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 16 }, sourceDot: { color: COLORS.cyan, fontSize: 8 }, sourceText: { color: "#77899C", fontSize: 9 }, notice: { padding: 13, backgroundColor: "#352A19", borderRadius: 12, marginBottom: 15 }, noticeText: { color: COLORS.amber, fontSize: 11 },
  compassCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 21 }, compassRing: { width: 146, height: 146, borderWidth: 1, borderColor: "#34515C", borderRadius: 73, alignItems: "center", justifyContent: "center" }, compassCardinal: { position: "absolute", color: COLORS.muted, fontSize: 10, fontWeight: "800" }, north: { top: 8, color: COLORS.pink }, east: { right: 10 }, south: { bottom: 8 }, west: { left: 10 }, compassNeedle: { width: 16, height: 82, alignItems: "center" }, needleNorth: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 40, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: COLORS.pink }, needleSouth: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 40, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#74869A" }, compassCenter: { position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.text }, headingInfo: { alignItems: "center" }, headingDegrees: { color: COLORS.text, fontSize: 34, fontWeight: "800" }, headingDirection: { color: COLORS.cyan, fontSize: 15, fontWeight: "700", marginTop: 2 }, headingCaption: { color: COLORS.muted, fontSize: 7, letterSpacing: 1, marginTop: 8 },
  gpsVisual: { height: 170, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 19, marginBottom: 17, overflow: "hidden", alignItems: "center", justifyContent: "center" }, mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.65, backgroundColor: "#0E1D2D" }, mapRoute: { height: 88, flexDirection: "row", alignItems: "center", transform: [{ rotate: "-25deg" }] }, routeNode: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.cyan, borderWidth: 3, borderColor: "#214B4E" }, routeDash: { width: 105, borderTopWidth: 2, borderColor: COLORS.cyan, borderStyle: "dashed" }, routePin: { width: 37, height: 37, borderRadius: 19, backgroundColor: `${COLORS.amber}22`, borderWidth: 1, borderColor: COLORS.amber, alignItems: "center", justifyContent: "center" }, routePinGlyph: { color: COLORS.amber, fontSize: 17 }, mapCaption: { position: "absolute", bottom: 13, color: COLORS.muted, fontSize: 8, letterSpacing: 1.6, fontWeight: "700" }, primaryButton: { height: 54, backgroundColor: COLORS.cyan, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, primaryButtonIcon: { color: COLORS.bg, fontSize: 21 }, primaryButtonText: { color: COLORS.bg, fontSize: 13, fontWeight: "800" }, primaryButtonArrow: { fontSize: 16 }, locationMessage: { textAlign: "center", color: COLORS.muted, fontSize: 10, lineHeight: 16, marginVertical: 12 }, coordinateCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 15, flexDirection: "row", alignItems: "center", marginBottom: 10 }, coordinate: { flex: 1 }, coordinateLabel: { color: COLORS.muted, fontSize: 8, letterSpacing: 1.3, fontWeight: "800" }, coordinateValue: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginTop: 8, fontVariant: ["tabular-nums"] }, coordinateDivider: { width: 1, height: 38, backgroundColor: COLORS.line, marginHorizontal: 12 }, accuracyCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 17 }, accuracyValue: { color: COLORS.text, fontSize: 19, fontWeight: "800", marginTop: 5 }, accuracyIcon: { color: COLORS.amber, fontSize: 25 },
  researchHero: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 21, padding: 19, marginBottom: 24 }, topicCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, padding: 15, marginBottom: 10 }, topicTop: { flexDirection: "row", alignItems: "center" }, topicNumber: { color: COLORS.cyan, fontSize: 9, fontWeight: "800", letterSpacing: 1 }, topicUnit: { color: COLORS.muted, fontSize: 8, marginLeft: 10, flex: 1, letterSpacing: 0.4 }, topicArrow: { color: COLORS.blue, fontSize: 14 }, topicTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginTop: 11 }, topicBody: { color: COLORS.muted, fontSize: 11, lineHeight: 18, marginTop: 6 }, citation: { color: "#65788D", fontSize: 9, lineHeight: 15, marginTop: 16 },
});
