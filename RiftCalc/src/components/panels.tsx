import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import {
  Action,
  AbilityKey,
  BuildConfiguration,
  ChampionStats,
  DamageResult as Result,
  Target,
} from "../engine/types";
import {
  championById,
  details,
  itemById,
  asset,
  strip,
  supported,
} from "../data/catalog";
import { maxRank } from "../engine/validation";
import {
  Button,
  BuffToggle,
  Card,
  ChampionIcon,
  DamageTypeBadge,
  Label,
  NumericInput,
  SafeIcon,
  styles,
  colors,
} from "./ui";
export const fmt = (n: number) =>
  n.toLocaleString("es-MX", { maximumFractionDigits: 1 });
export function StatRow({
  name,
  value,
}: {
  name: string;
  value: number | string;
}) {
  return (
    <View style={[styles.row, { justifyContent: "space-between" }]}>
      <Label>{name}</Label>
      <Text style={[styles.text, { fontWeight: "600" }]}>
        {typeof value === "number" ? fmt(value) : value}
      </Text>
    </View>
  );
}
export function StatGrid({ stats: s }: { stats: ChampionStats }) {
  return (
    <View style={styles.row}>
      {Object.entries({
        Vida: s.hp,
        AD: s.ad,
        AP: s.ap,
        Armadura: s.armor,
        RM: s.mr,
        "Vel. ataque": s.as.toFixed(2),
        Aceleración: s.haste,
        Crítico: `${Math.round(s.crit * 100)}%`,
        Letalidad: s.lethality,
        "Pen. arm.": `${Math.round(s.armorPen * 100)}%`,
        "Pen. magia": `${fmt(s.magicPen)} + ${Math.round(s.magicPenPercent * 100)}%`,
      }).map(([name, value]) => (
        <View key={name} style={{ width: "46%", paddingVertical: 5 }}>
          <StatRow name={name} value={value} />
        </View>
      ))}
    </View>
  );
}
export function ChampionCard({
  config,
  stats,
  onChange,
}: {
  config: BuildConfiguration;
  stats: ChampionStats;
  onChange: () => void;
}) {
  const c = championById[config.championId];
  return (
    <Card title="Tu campeón" kicker="01 / CONFIGURACIÓN">
      <View style={styles.row}>
        <ChampionIcon id={c.id} name={c.name} size={80} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>
            {c.name}
          </Text>
          <Label>{c.title}</Label>
          <Text style={{ color: colors.accent, fontSize: 11 }}>
            {supported.includes(c.id)
              ? "MODELO DE DAÑO MVP"
              : "MODELO DE DAÑO AVANZADO PENDIENTE"}
          </Text>
        </View>
      </View>
      <Button title="Cambiar campeón" onPress={onChange} />
      <StatGrid stats={stats} />
    </Card>
  );
}
export function LevelSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <NumericInput
          label="Nivel del campeón"
          value={value}
          min={1}
          max={18}
          onChange={onChange}
        />
        <Text style={{ fontSize: 34, color: colors.accent, fontWeight: "700" }}>
          {value}
          <Text style={styles.muted}> / 18</Text>
        </Text>
      </View>
      <Slider
        accessibilityLabel="Nivel del campeón (deslizador)"
        minimumValue={1}
        maximumValue={18}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}
export function AbilityLevelSelector({
  ability,
  rank,
  level,
  spent,
  onChange,
}: {
  ability: AbilityKey;
  rank: number;
  level: number;
  spent: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Button
        title={`− ${ability}`}
        disabled={rank === 0}
        onPress={() => onChange(rank - 1)}
      />
      <Text style={styles.text}>
        {rank} / {ability === "R" ? 3 : 5}
      </Text>
      <Button
        title={`+ ${ability}`}
        disabled={rank >= maxRank(ability, level) || spent >= level}
        onPress={() => onChange(rank + 1)}
      />
    </View>
  );
}
const formulaNotes: Record<string, string[]> = {
  Ahri: [
    "Mágico + verdadero · 35–135 + 50% AP por trayecto",
    "Mágico · 40–120 + 40% AP; repeticiones al 40%",
    "Mágico · 80–240 + 85% AP",
    "Mágico · 75–175 + 35% AP por desplazamiento",
  ],
  Jinx: [
    "Cambia de arma · cohetes: 110% AD por AA",
    "Físico · 10–210 + 140% AD",
    "Mágico · 90–290 + 100% AP",
    "Físico · 20–50 a 200–500 + AD adicional + vida faltante",
  ],
  Garen: [
    "Físico · 30–150 + 150% AD; incluye el ataque",
    "Defensiva · no inflige daño",
    "Físico · 4–16 + 40–52% AD por giro",
    "Verdadero · 125–275 + 25–35% vida faltante",
  ],
};
export function AbilityCard({
  config,
  onRank,
}: {
  config: BuildConfiguration;
  onRank: (a: AbilityKey, n: number) => void;
}) {
  const d = details[config.championId as keyof typeof details];
  return (
    <Card title="Habilidades" kicker="PUNTOS Y ESCALADOS" collapsible>
      {d ? (
        <>
          <View style={styles.row}>
            <SafeIcon
              name={d.passive.name}
              uri={asset("passive", d.passive.image.full)}
              size={36}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>P · {d.passive.name}</Text>
              <Label>
                Sin daño directo. Curación, reinicios y velocidad temporal fuera
                del modelo.
              </Label>
            </View>
          </View>
          {d.spells.map((a, i) => {
            const key = (["Q", "W", "E", "R"] as AbilityKey[])[i];
            return (
              <View
                key={key}
                style={{
                  gap: 10,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={styles.row}>
                  <SafeIcon
                    name={a.name}
                    uri={asset("spell", a.image.full)}
                    size={36}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>
                      {key} · {a.name}
                    </Text>
                    <Label>{formulaNotes[config.championId][i]}</Label>
                  </View>
                </View>
                <AbilityLevelSelector
                  ability={key}
                  rank={config.ranks[key]}
                  level={config.level}
                  spent={Object.values(config.ranks).reduce((a, b) => a + b, 0)}
                  onChange={(n) => onRank(key, n)}
                />
              </View>
            );
          })}
        </>
      ) : (
        <Label>
          Modelo de daño avanzado pendiente. Puedes calcular un ataque básico y
          configurar estadísticas.
        </Label>
      )}
    </Card>
  );
}
export function ItemSlot({
  id,
  index,
  onSelect,
  onRemove,
}: {
  id: string | null;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const item = id ? itemById[id] : null;
  return (
    <View style={{ width: "30%", gap: 5 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Objeto ${index + 1}: ${item?.name || "vacío"}`}
        onPress={onSelect}
        style={[styles.button, { height: 84, gap: 5, paddingHorizontal: 4 }]}
      >
        {item ? (
          <SafeIcon
            name={item.name}
            uri={asset("item", item.image.full)}
            size={48}
          />
        ) : (
          <Text style={{ fontSize: 28, color: colors.muted }}>+</Text>
        )}
      </Pressable>
      <Text
        numberOfLines={2}
        style={{ color: colors.muted, fontSize: 10, minHeight: 28 }}
      >
        {item?.name || `Espacio ${index + 1}`}
      </Text>
      {item && <Button title={`Quitar ${index + 1}`} onPress={onRemove} />}
    </View>
  );
}
export function DragonBuffSelector({
  config,
  onChange,
}: {
  config: BuildConfiguration;
  onChange: (b: Partial<BuildConfiguration["buffs"]>) => void;
}) {
  const b = config.buffs,
    total = b.infernal + b.mountain + b.hextech;
  return (
    <View style={{ gap: 12 }}>
      <Label>DRAGONES · máximo 4 acumulaciones entre todos</Label>
      {(["infernal", "mountain", "hextech"] as const).map((key, i) => (
        <NumericInput
          key={key}
          label={
            [
              "Infernal · +3% AD / AP",
              "Montaña · +5% resistencias",
              "Hextech · +5 aceleración / +5% AS",
            ][i]
          }
          value={b[key]}
          max={4 - total + b[key]}
          onChange={(v) => onChange({ [key]: v })}
        />
      ))}
      <Label>
        Océano y Nube: no modifican este daño instantáneo. Quimtech, almas,
        Anciano y Barón: pendientes.
      </Label>
    </View>
  );
}
export function BuffSelector({
  config,
  onChange,
}: {
  config: BuildConfiguration;
  onChange: (b: Partial<BuildConfiguration["buffs"]>) => void;
}) {
  const b = config.buffs;
  return (
    <Card title="Buffs y condiciones" collapsible>
      <DragonBuffSelector config={config} onChange={onChange} />
      <BuffToggle
        label="Bonificación de aliado (manual)"
        value={b.allyEnabled}
        onChange={(v) => onChange({ allyEnabled: v })}
      />
      {b.allyEnabled && (
        <>
          <Label>
            Introduce la bonificación real recibida; no se presupone un support
            concreto.
          </Label>
          <View style={styles.row}>
            <NumericInput
              label="AP del aliado"
              value={b.allyAp}
              max={2000}
              onChange={(v) => onChange({ allyAp: v })}
            />
            <NumericInput
              label="AD del aliado"
              value={b.allyAd}
              max={2000}
              onChange={(v) => onChange({ allyAd: v })}
            />
          </View>
        </>
      )}
      {config.championId === "Garen" && (
        <>
          <BuffToggle
            label="Objetivo más cercano (Garen E)"
            value={b.nearest}
            onChange={(v) => onChange({ nearest: v })}
          />
          <NumericInput
            label="Bajas acumuladas · Garen W"
            value={b.garenStacks}
            max={150}
            onChange={(v) => onChange({ garenStacks: v })}
          />
        </>
      )}
      {config.championId === "Jinx" && (
        <BuffToggle
          label="R a distancia máxima"
          value={b.rocketMax}
          onChange={(v) => onChange({ rocketMax: v })}
        />
      )}
      {config.runes.includes(8112) && (
        <BuffToggle
          label="Electrocutar disponible"
          value={b.electrocute}
          onChange={(v) => onChange({ electrocute: v })}
        />
      )}
      {config.runes.includes(8233) && (
        <BuffToggle
          label="Campeón sobre 70% de vida"
          value={b.healthy}
          onChange={(v) => onChange({ healthy: v })}
        />
      )}
      {config.items.some((id) =>
        ["3115", "6655", "3057"].includes(id || ""),
      ) && (
        <BuffToggle
          label="Efectos de objetos disponibles"
          value={b.proc}
          onChange={(v) => onChange({ proc: v })}
        />
      )}
    </Card>
  );
}
export function TargetPanel({
  target,
  onChange,
  onPreset,
  onLevel,
}: {
  target: Target;
  onChange: (t: Partial<Target>) => void;
  onPreset: () => void;
  onLevel: (level: number) => void;
}) {
  return (
    <Card title="Objetivo" kicker="02 / CONTRA QUIÉN" collapsible>
      <View style={styles.row}>
        <Button
          title="Personalizado"
          active={!target.championId}
          onPress={() => onChange({ championId: undefined })}
        />
        <Button
          title="Elegir campeón"
          active={!!target.championId}
          onPress={onPreset}
        />
      </View>
      {target.championId && (
        <>
          <View style={styles.row}>
            <ChampionIcon
              id={target.championId}
              name={championById[target.championId].name}
            />
            <Text style={styles.text}>
              {championById[target.championId].name}
            </Text>
          </View>
          <NumericInput
            label="Nivel enemigo"
            value={target.level}
            min={1}
            max={18}
            onChange={onLevel}
          />
        </>
      )}
      <View style={styles.row}>
        <NumericInput
          label="Vida máxima"
          value={target.maxHealth}
          min={1}
          max={100000}
          onChange={(v) =>
            onChange({ maxHealth: v, health: Math.min(v, target.health) })
          }
        />
        <NumericInput
          label="Vida actual"
          value={target.health}
          max={target.maxHealth}
          onChange={(v) => onChange({ health: v })}
        />
      </View>
      <View style={styles.row}>
        <NumericInput
          label="Armadura"
          value={target.armor}
          min={-500}
          max={5000}
          step={0.1}
          onChange={(v) => onChange({ armor: v })}
        />
        <NumericInput
          label="Resistencia mágica"
          value={target.mr}
          min={-500}
          max={5000}
          step={0.1}
          onChange={(v) => onChange({ mr: v })}
        />
      </View>
      <View style={styles.row}>
        <NumericInput
          label="Escudo universal"
          value={target.shield}
          max={100000}
          onChange={(v) => onChange({ shield: v })}
        />
        <NumericInput
          label="Reducción de daño %"
          value={target.reduction}
          max={100}
          onChange={(v) => onChange({ reduction: v })}
        />
      </View>
      <Label>
        Las resistencias se pueden editar incluso con un preset. Sin objetos
        defensivos automáticos.
      </Label>
    </Card>
  );
}
export function ActionSelector({
  selected,
  onSelect,
}: {
  selected: Action[];
  onSelect: (a: Action) => void;
}) {
  return (
    <View style={styles.row}>
      {(["AA", "Q", "W", "E", "R"] as Action[]).map((a) => (
        <Button
          key={a}
          title={a}
          active={selected.length === 1 && selected[0] === a}
          onPress={() => onSelect(a)}
        />
      ))}
    </View>
  );
}
export function ComboBuilder({
  actions,
  onChange,
}: {
  actions: Action[];
  onChange: (a: Action[]) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        {actions.map((a, i) => (
          <Button
            key={i}
            title={`${i + 1}. ${a} ×`}
            onPress={() => onChange(actions.filter((_, j) => j !== i))}
          />
        ))}
      </View>
      {!actions.length && (
        <Label>Añade acciones para construir tu combo.</Label>
      )}
      <View style={styles.row}>
        {(["AA", "Q", "W", "E", "R"] as Action[]).map((a) => (
          <Button
            key={a}
            title={`+ ${a}`}
            disabled={actions.length >= 30}
            onPress={() => onChange([...actions, a])}
          />
        ))}
      </View>
      <Button title="Limpiar combo" onPress={() => onChange([])} />
      <Label>
        Se procesan de izquierda a derecha. Pulsa una acción para quitarla. Q de
        Jinx cambia de arma; Q de Garen incluye el ataque.
      </Label>
    </View>
  );
}
export function DamageResult({
  result: r,
  target,
}: {
  result: Result;
  target: Target;
}) {
  const percent = target.health ? (100 * r.healthRemoved) / target.health : 0;
  return (
    <View
      style={[
        styles.card,
        { borderColor: "#23516B", backgroundColor: "#101D2A" },
      ]}
    >
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <Text style={styles.tiny}>03 / RESULTADO EN VIVO</Text>
        <Text style={{ color: colors.accent, fontSize: 11 }}>● ESTIMACIÓN</Text>
      </View>
      <Label>DAÑO DESPUÉS DE RESISTENCIAS</Label>
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: colors.text,
          fontSize: 60,
          fontWeight: "800",
          letterSpacing: -3,
        }}
      >
        {fmt(r.totalFinalDamage)}
      </Text>
      <View style={[styles.row, { gap: 16 }]}>
        {(["physical", "magic", "true"] as const).map((type, i) => (
          <View key={type} style={{ gap: 5 }}>
            <DamageTypeBadge type={type} />
            <Text
              style={{ color: colors[type], fontSize: 23, fontWeight: "600" }}
            >
              {fmt([r.physicalDamage, r.magicDamage, r.trueDamage][i])}
            </Text>
          </View>
        ))}
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: colors.border,
          borderRadius: 4,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {(["physical", "magic", "true"] as const).map((t, i) => (
          <View
            key={t}
            style={{
              height: 8,
              backgroundColor: colors[t],
              width: `${r.totalFinalDamage ? ([r.physicalDamage, r.magicDamage, r.trueDamage][i] / r.totalFinalDamage) * 100 : 0}%`,
            }}
          />
        ))}
      </View>
      <StatRow name="Daño bruto" value={r.totalRawDamage} />
      <StatRow name="Vida inicial" value={target.health} />
      <StatRow
        name="Absorbido por escudo"
        value={r.sources.reduce((n, s) => n + s.absorbed, 0)}
      />
      <StatRow name="Vida restante" value={r.targetRemainingHealth} />
      <View
        style={{ backgroundColor: "#153D36", borderRadius: 8, padding: 14 }}
      >
        <Text style={{ color: "#7CE4BB", fontWeight: "600" }}>
          {fmt(percent)}% de la vida inicial eliminada
        </Text>
      </View>
      <Label>
        El total puede incluir sobre-daño. La vida eliminada está limitada a la
        vida actual.
      </Label>
    </View>
  );
}
export function DamageBreakdown({ result }: { result: Result }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <Card title="Desglose de daño" kicker="CADA IMPACTO, EXPLICADO">
      {!result.sources.length && (
        <Label>No hay impactos de daño en esta secuencia.</Label>
      )}
      {result.sources.map((s, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={`Detalle ${s.source}`}
          onPress={() => setExpanded(expanded === i ? null : i)}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingBottom: 12,
            gap: 6,
          }}
        >
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.text}>{s.source}</Text>
              <DamageTypeBadge type={s.type} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.text, { fontWeight: "700" }]}>
                {fmt(s.final)}
              </Text>
              <Label>bruto {fmt(s.raw)}</Label>
            </View>
          </View>
          {expanded === i && (
            <Label>
              {s.formula}
              {"\n"}Resistencia efectiva: {fmt(s.resistance)} · t ≈{" "}
              {fmt(s.time)} s{"\n"}Escudo: {fmt(s.absorbed)} · Vida eliminada:{" "}
              {fmt(s.healthDamage)}
            </Label>
          )}
        </Pressable>
      ))}
    </Card>
  );
}
