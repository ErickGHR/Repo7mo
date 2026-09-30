import React from "react";
import { View, Text } from "react-native";
import { abilityCatalog } from "../data/abilities";
import { asset, strip, supported } from "../data/catalog";
import {
  advancedChampions,
  transformationForms,
} from "../engine/champion-mechanics";
import { AbilityKey, BuildConfiguration } from "../engine/types";
import { maxRank } from "../engine/validation";
import { Button, Card, Label, SafeIcon, styles, colors } from "./ui";
import { FormulaExplorer } from "./formula-explorer";
export function AbilityCard({
  config,
  onRank,
  onMechanics,
}: {
  config: BuildConfiguration;
  onRank: (a: AbilityKey, n: number) => void;
  onMechanics: (value: NonNullable<BuildConfiguration["mechanics"]>) => void;
}) {
  const d = abilityCatalog[config.championId];
  const freeR = ["Jayce", "Elise", "Nidalee", "Karma"].includes(
    config.championId,
  )
    ? 1
    : 0;
  const available =
    config.level +
    freeR -
    Object.values(config.ranks).reduce((a, b) => a + b, 0);
  const forms = transformationForms[config.championId];
  return (
    <>
      <Card
        title="Habilidades y pasiva"
        kicker="CATÁLOGO DEL PARCHE"
        collapsible
      >
        <View style={styles.row}>
          <SafeIcon
            name={d.passive.name}
            uri={asset("passive", d.passive.image.full)}
            size={36}
          />
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.text}>P · {d.passive.name}</Text>
            <Label>{strip(d.passive.description)}</Label>
          </View>
        </View>
        {forms && (
          <>
            <Label>
              Forma inicial; cada R cambia de forma durante el combo.
            </Label>
            <View style={styles.row}>
              {forms.map((form, i) => (
                <Button
                  key={form}
                  title={form}
                  active={!!config.mechanics?.alternateForm === !!i}
                  onPress={() => onMechanics({ alternateForm: !!i })}
                />
              ))}
            </View>
          </>
        )}
        {freeR > 0 && (
          <Label>
            R comienza desbloqueada y su primer rango no consume puntos.
          </Label>
        )}
        {d.abilities.map((a) => (
          <View
            key={a.key}
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
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.text}>
                  {a.key} · {a.name}
                </Text>
                <Label>{strip(a.description)}</Label>
              </View>
            </View>
            <View style={styles.row}>
              <Button
                title={"− " + a.key}
                disabled={config.ranks[a.key] <= (a.key === "R" ? freeR : 0)}
                onPress={() => onRank(a.key, config.ranks[a.key] - 1)}
              />
              <Text style={styles.text}>
                {config.ranks[a.key]} / {maxRank(a.key, 18, config.championId)}
              </Text>
              <Button
                title={"+ " + a.key}
                disabled={
                  available <= 0 ||
                  config.ranks[a.key] >=
                    maxRank(a.key, config.level, config.championId)
                }
                onPress={() => onRank(a.key, config.ranks[a.key] + 1)}
              />
            </View>
          </View>
        ))}
        <Label>
          {supported.includes(config.championId) ||
          advancedChampions.includes(config.championId)
            ? "El desglose indica qué efectos se calculan y cuáles quedan fuera de la simulación."
            : "Habilidades y pasiva disponibles como referencia. Este campeón todavía no tiene un modelo de combate automático; el combo solo calcula AA genéricos."}
        </Label>
      </Card>
      <FormulaExplorer key={config.championId} config={config} />
    </>
  );
}
