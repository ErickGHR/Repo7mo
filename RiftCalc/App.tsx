import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Linking,
} from "react-native";
import {
  initialConfig,
  patch,
  championById,
  itemById,
  runes,
  supported,
} from "./src/data/catalog";
import { BuildConfiguration, Champion, Rune, Target } from "./src/engine/types";
import { calculateScenario } from "./src/engine/scenario";
import { calculateChampionStatsAtLevel } from "./src/engine/stats";
import { normalizeRanks } from "./src/engine/validation";
import { loadBuilds, persistBuilds } from "./src/data/storage";
import {
  Button,
  Card,
  Label,
  NumericInput,
  PatchBadge,
  styles,
  colors,
} from "./src/components/ui";
import {
  ChampionSelector,
  ItemSelector,
  RuneSelector,
  RuneSlot,
} from "./src/components/selectors";
import {
  AbilityCard,
  ActionSelector,
  BuffSelector,
  ChampionCard,
  ComboBuilder,
  DamageBreakdown,
  DamageResult,
  ItemSlot,
  LevelSelector,
  TargetPanel,
  fmt,
} from "./src/components/panels";
export default function App() {
  const { width } = useWindowDimensions();
  const desktop = width >= 1180;
  const [config, setConfig] = useState<BuildConfiguration>(initialConfig),
    [championModal, setChampionModal] = useState<"self" | "target" | null>(
      null,
    ),
    [itemSlot, setItemSlot] = useState<number | null>(null),
    [runeModal, setRuneModal] = useState(false),
    [saved, setSaved] = useState<BuildConfiguration[]>([]),
    [message, setMessage] = useState(""),
    [storageReady, setStorageReady] = useState(false),
    [busy, setBusy] = useState(false),
    [comparison, setComparison] = useState<BuildConfiguration | null>(null),
    [comboMode, setComboMode] = useState(true);
  const update = (value: Partial<BuildConfiguration>) =>
    setConfig((c) => ({ ...c, ...value }));
  const result = useMemo(() => calculateScenario(config), [config]);
  const comparisonResult = useMemo(
    () =>
      comparison
        ? calculateScenario({
            ...comparison,
            target: config.target,
            actions: config.actions,
          })
        : null,
    [comparison, config.target, config.actions],
  );
  useEffect(() => {
    loadBuilds()
      .then(({ builds, rejected }) => {
        setSaved(builds);
        if (rejected)
          setMessage(
            `${rejected} guardados de otro parche o inválidos omitidos.`,
          );
        setStorageReady(true);
      })
      .catch(() =>
        setMessage(
          "No se pudo leer el almacenamiento. Recarga antes de guardar para evitar sobrescribir tus builds.",
        ),
      );
  }, []);
  async function save() {
    if (!config.name.trim()) {
      setMessage("Escribe un nombre para la build.");
      return;
    }
    setBusy(true);
    const next = [
      { ...config, name: config.name.trim() },
      ...saved.filter((b) => b.name !== config.name.trim()),
    ].slice(0, 30);
    try {
      await persistBuilds(next);
      setSaved(next);
      setMessage("Build guardada en este dispositivo.");
    } catch {
      setMessage("No se pudo guardar. Comprueba el espacio disponible.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(name: string) {
    setBusy(true);
    const next = saved.filter((b) => b.name !== name);
    try {
      await persistBuilds(next);
      setSaved(next);
      setMessage("Build eliminada.");
    } catch {
      setMessage("No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }
  function targetPreset(champion: Champion, level = config.target.level) {
    const s = calculateChampionStatsAtLevel(champion, level);
    update({
      target: {
        ...config.target,
        championId: champion.id,
        level,
        maxHealth: Math.round(s.hp),
        health: Math.round(s.hp),
        armor: Math.round(s.armor * 10) / 10,
        mr: Math.round(s.mr * 10) / 10,
      },
    });
  }
  function selectRune(r: Rune) {
    let selected = config.runes
      .map((id) => runes.find((x) => x.id === id)!)
      .filter(Boolean);
    if (selected.some((x) => x.id === r.id)) {
      update({ runes: selected.filter((x) => x.id !== r.id).map((x) => x.id) });
      return;
    }
    const primary = selected.find((x) => x.slot === 0)?.tree;
    if (r.slot === 0) {
      selected = selected.filter((x) => x.slot !== 0 && x.tree === r.tree);
      selected.push(r);
    } else if (!primary) {
      setMessage("Selecciona primero una runa clave.");
      return;
    } else if (r.tree === primary) {
      selected = selected.filter(
        (x) => !(x.tree === r.tree && x.slot === r.slot),
      );
      selected.push(r);
    } else {
      selected = selected.filter(
        (x) => x.tree === primary || (x.tree === r.tree && x.slot !== r.slot),
      );
      const secondary = selected.filter((x) => x.tree !== primary);
      if (secondary.length >= 2)
        selected = selected.filter((x) => x.id !== secondary[0].id);
      selected.push(r);
    }
    update({ runes: selected.map((x) => x.id) });
  }
  const targetPanel = (
    <TargetPanel
      target={config.target}
      onChange={(t) => update({ target: { ...config.target, ...t } })}
      onPreset={() => setChampionModal("target")}
      onLevel={(level) =>
        config.target.championId &&
        targetPreset(championById[config.target.championId], level)
      }
    />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: width < 600 ? 16 : 32,
          paddingTop: 36,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            maxWidth: 1512,
            width: "100%",
            alignSelf: "center",
            gap: 24,
          }}
        >
          <View
            style={[
              styles.row,
              {
                justifyContent: "space-between",
                paddingBottom: 22,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={app.logo}>
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 25,
                    fontWeight: "800",
                  }}
                >
                  R/
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: colors.text,
                    letterSpacing: -0.8,
                  }}
                >
                  RiftCalc<Text style={{ color: colors.accent }}> .</Text>
                </Text>
                <Text style={styles.tiny}>LEAGUE DAMAGE LAB</Text>
              </View>
            </View>
            <View style={[styles.row, { maxWidth: "100%", flexShrink: 1 }]}>
              <Text style={styles.muted}>
                Grieta del Invocador · Proyecto académico
              </Text>
              <PatchBadge patch={patch} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[styles.tiny, { color: colors.accent }]}>
              CONFIGURA. CALCULA. COMPRENDE.
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: width < 600 ? 29 : 38,
                fontWeight: "700",
                letterSpacing: -1.2,
                color: colors.text,
              }}
            >
              Cada decisión cambia el daño.
            </Text>
            <Label>
              Explora tu build, construye un combo y descubre qué hay detrás de
              cada impacto.
            </Label>
          </View>
          {message ? (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: "#163044",
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.text, { flex: 1 }]}
              >
                {message}
              </Text>
              <Button title="Entendido" onPress={() => setMessage("")} />
            </View>
          ) : null}
          <View
            style={{
              flexDirection: desktop ? "row" : "column",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            <View style={{ width: desktop ? "27%" : "100%", gap: 20 }}>
              <ChampionCard
                config={config}
                stats={result.stats}
                onChange={() => setChampionModal("self")}
              />
              <Card title="Estado de la partida">
                <LevelSelector
                  value={config.level}
                  onChange={(level) =>
                    update({
                      level,
                      ranks: normalizeRanks(config.ranks, level),
                    })
                  }
                />
                <NumericInput
                  label="Minuto de partida (22.5 = 22:30)"
                  value={config.minute}
                  max={180}
                  step={0.5}
                  onChange={(minute) => update({ minute })}
                />
              </Card>
              {desktop && targetPanel}
            </View>
            <View
              style={{
                flex: desktop ? 1 : undefined,
                width: desktop ? undefined : "100%",
                gap: 20,
              }}
            >
              <Card
                title="Tu build"
                kicker="SEIS ESPACIOS. MUCHAS POSIBILIDADES."
              >
                <View
                  style={[
                    styles.row,
                    {
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    },
                  ]}
                >
                  {config.items.map((id, i) => (
                    <ItemSlot
                      key={i}
                      id={id}
                      index={i}
                      onSelect={() => setItemSlot(i)}
                      onRemove={() =>
                        update({
                          items: config.items.map((v, j) =>
                            j === i ? null : v,
                          ),
                        })
                      }
                    />
                  ))}
                </View>
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <Label>INVERSIÓN TOTAL</Label>
                  <Text style={{ color: "#E3C883", fontWeight: "600" }}>
                    {fmt(
                      config.items.reduce(
                        (n, id) => n + (id ? itemById[id].gold.total : 0),
                        0,
                      ),
                    )}{" "}
                    G
                  </Text>
                </View>
              </Card>
              <AbilityCard
                config={config}
                onRank={(a, n) =>
                  update({ ranks: { ...config.ranks, [a]: n } })
                }
              />
              <Card title="Runas y fragmentos" collapsible>
                {config.runes.map((id) => {
                  const r = runes.find((r) => r.id === id);
                  return r ? (
                    <RuneSlot
                      key={id}
                      rune={r}
                      onPress={() => setRuneModal(true)}
                    />
                  ) : null;
                })}
                <Button
                  title="Configurar runas"
                  onPress={() => setRuneModal(true)}
                />
                {config.shards.map((s, i) => (
                  <View key={i} style={{ gap: 6 }}>
                    <Label>Fragmento {i + 1}</Label>
                    <View style={styles.row}>
                      {(i === 0
                        ? ["adaptive", "as", "haste"]
                        : i === 1
                          ? ["adaptive", "health"]
                          : ["health"]
                      ).map((v) => (
                        <Button
                          key={v}
                          title={
                            {
                              adaptive: "Adaptable",
                              as: "Vel. ataque",
                              haste: "Aceleración",
                              health: "Vida / nivel",
                            }[v]!
                          }
                          active={s === v}
                          onPress={() =>
                            update({
                              shards: config.shards.map((old, j) =>
                                i === j ? v : old,
                              ) as BuildConfiguration["shards"],
                            })
                          }
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </Card>
              <BuffSelector
                config={config}
                onChange={(b) => update({ buffs: { ...config.buffs, ...b } })}
              />
              {!desktop && targetPanel}
              <Card
                title="¿Qué quieres calcular?"
                kicker="CONSTRUYE TU SECUENCIA"
              >
                <View style={styles.row}>
                  <Button
                    title="Acción individual"
                    active={!comboMode}
                    onPress={() => {
                      setComboMode(false);
                      update({ actions: ["AA"] });
                    }}
                  />
                  <Button
                    title="Combo personalizado"
                    active={comboMode}
                    onPress={() => setComboMode(true)}
                  />
                </View>
                {comboMode ? (
                  <ComboBuilder
                    actions={config.actions}
                    onChange={(actions) => update({ actions })}
                  />
                ) : (
                  <ActionSelector
                    selected={config.actions}
                    onSelect={(a) => update({ actions: [a] })}
                  />
                )}
              </Card>
            </View>
            <View style={{ width: desktop ? "31%" : "100%", gap: 20 }}>
              <DamageResult result={result} target={config.target} />
              <DamageBreakdown result={result} />
              <Card title="Cobertura del cálculo" collapsible>
                <Text style={{ color: "#7CE4BB", fontSize: 12 }}>INCLUIDO</Text>
                {result.included.map((s) => (
                  <Label key={s}>✓ {s}</Label>
                ))}
                <Text style={{ color: "#E3C883", fontSize: 12 }}>
                  LÍMITES DEL ESCENARIO
                </Text>
                {result.warnings.map((s) => (
                  <Label key={s}>△ {s}</Label>
                ))}
                <Label>
                  Modelo académico de impacto contra un campeón. No equivale a
                  una simulación completa de partida.
                </Label>
              </Card>
              <Card title="Guardar y comparar">
                <TextInput
                  accessibilityLabel="Nombre de la build"
                  placeholder="Nombre de la build"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={config.name}
                  maxLength={80}
                  onChangeText={(name) => update({ name })}
                />
                <Button
                  title="Guardar build"
                  disabled={!storageReady || busy}
                  onPress={save}
                />
                <Button
                  title="Fijar como Build A"
                  onPress={() =>
                    setComparison(JSON.parse(JSON.stringify(config)))
                  }
                />
                {comparisonResult && comparison && (
                  <View style={{ gap: 10 }}>
                    <Label>
                      A: {comparison.name} · mismo objetivo y acciones actuales
                    </Label>
                    <Text style={styles.text}>
                      A {fmt(comparisonResult.totalFinalDamage)} → B{" "}
                      {fmt(result.totalFinalDamage)}
                    </Text>
                    <Text
                      style={{
                        color: colors.accent,
                        fontSize: 22,
                        fontWeight: "700",
                      }}
                    >
                      {result.totalFinalDamage -
                        comparisonResult.totalFinalDamage >=
                      0
                        ? "+"
                        : ""}
                      {fmt(
                        result.totalFinalDamage -
                          comparisonResult.totalFinalDamage,
                      )}{" "}
                      daño
                    </Text>
                    <Button
                      title="Quitar comparación"
                      onPress={() => setComparison(null)}
                    />
                  </View>
                )}
                <Label>BUILDS GUARDADAS · {saved.length} / 30</Label>
                {saved.map((b, i) => (
                  <View key={i} style={{ gap: 6 }}>
                    <Button
                      title={`Cargar ${b.name}`}
                      onPress={() => {
                        setConfig(b);
                        setComboMode(b.actions.length !== 1);
                        setMessage("Build cargada.");
                      }}
                    />
                    <Button
                      title={`Eliminar ${b.name}`}
                      disabled={busy}
                      onPress={() => remove(b.name)}
                    />
                  </View>
                ))}
                {!saved.length && (
                  <Label>Tus escenarios se guardan en este dispositivo.</Label>
                )}
              </Card>
            </View>
          </View>
          <View
            style={{
              paddingTop: 22,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              gap: 10,
            }}
          >
            <Text style={styles.muted}>
              RiftCalc · Erick Gabriel Hernández Rebolledo · React Native + Expo
            </Text>
            <Text style={[styles.muted, { fontSize: 10 }]}>
              RiftCalc isn't endorsed by Riot Games and doesn't reflect the
              views or opinions of Riot Games or anyone officially involved in
              producing or managing Riot Games properties. Riot Games, and all
              associated properties are trademarks or registered trademarks of
              Riot Games, Inc.
            </Text>
            <Button
              title="Fuentes y política de Riot Games ↗"
              onPress={() =>
                Linking.openURL(
                  "https://support-developer.riotgames.com/hc/en-us/articles/22698591841939-General-Policies",
                )
              }
            />
          </View>
        </View>
      </ScrollView>
      <ChampionSelector
        visible={championModal !== null}
        selected={
          championModal === "target"
            ? config.target.championId || ""
            : config.championId
        }
        onClose={() => setChampionModal(null)}
        onSelect={(c) =>
          championModal === "target"
            ? targetPreset(c)
            : update({
                championId: c.id,
                name: `${c.name} · Nivel ${config.level}`,
                actions: ["AA"],
              })
        }
      />
      <ItemSelector
        visible={itemSlot !== null}
        equipped={config.items}
        onClose={() => setItemSlot(null)}
        onSelect={(i) =>
          update({
            items: config.items.map((id, index) =>
              index === itemSlot ? i.id : id,
            ),
          })
        }
      />
      <RuneSelector
        visible={runeModal}
        selected={config.runes}
        onSelect={selectRune}
        onClose={() => setRuneModal(false)}
      />
    </View>
  );
}
const app = StyleSheet.create({
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27546F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102C40",
  },
});
