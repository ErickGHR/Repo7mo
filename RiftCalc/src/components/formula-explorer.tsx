import React, { useState } from "react";
import { View, Text } from "react-native";
import { abilityCatalog, abilityPatch } from "../data/abilities";
import { championById } from "../data/catalog";
import { BuildConfiguration } from "../engine/types";
import { calculateChampionStatsAtLevel, calculateStats } from "../engine/stats";
import { evaluateFormula } from "../engine/formulas";
import { Button, Card, Label, NumericInput, styles } from "./ui";
/** A separate numeric inspector: a tooltip expression is not an automatic combat model. */
export function FormulaExplorer({ config }: { config: BuildConfiguration }) {
  const catalog = abilityCatalog[config.championId];
  const entries = Object.entries(catalog.spells).filter(
    ([, s]) => Object.keys(s.calculations).length,
  );
  const [selected, setSelected] = useState("");
  const [rank, setRank] = useState(1);
  const current = entries.find(([p]) => p === selected) || entries[0];
  const [showVariants, setShowVariants] = useState(false);
  if (!current)
    return (
      <Label>
        Este campeón no tiene fórmulas interpretables publicadas en este
        registro.
      </Label>
    );
  const [path, spell] = current;
  const stats = calculateStats(config),
    base = calculateChampionStatsAtLevel(
      championById[config.championId],
      config.level,
    );
  const label = (p: string) => {
    const ability = catalog.abilities.find((a) => a.path === p);
    if (ability) return `${ability.key} · ${ability.name}`;
    if (p === catalog.passive.path) return `P · ${catalog.passive.name}`;
    return p.split("/").pop()!;
  };
  const primary = entries.filter(
    ([p]) =>
      catalog.abilities.some((a) => a.path === p) || p === catalog.passive.path,
  );
  return (
    <Card
      title="Explorador de fórmulas"
      collapsible
      kicker={`REFERENCIA · ${abilityPatch}`}
    >
      <Label>
        Consulta valores de habilidades, pasivas y variantes con tu build. Son
        componentes numéricos: pueden representar daño por impacto, porcentajes,
        curación o escudos. No se suman automáticamente al combo ni confirman
        que una mecánica esté simulada.
      </Label>
      <View style={styles.row}>
        {primary.map(([p]) => (
          <Button
            key={p}
            title={label(p)}
            active={p === path}
            onPress={() => {
              setSelected(p);
              setRank(
                p === catalog.passive.path
                  ? 0
                  : config.ranks[
                      catalog.abilities.find((a) => a.path === p)!.key
                    ],
              );
            }}
          />
        ))}
      </View>
      <Button
        title={
          showVariants
            ? "Ocultar variantes"
            : "Ver variantes y registros adicionales"
        }
        onPress={() => setShowVariants(!showVariants)}
      />
      {showVariants && (
        <View style={styles.row}>
          {entries
            .filter(([p]) => !primary.some(([x]) => x === p))
            .map(([p]) => (
              <Button
                key={p}
                title={label(p)}
                active={p === path}
                onPress={() => setSelected(p)}
              />
            ))}
        </View>
      )}
      <Text style={styles.text}>{label(path)}</Text>
      <NumericInput
        label="Rango del registro (0 = sin aprender / pasiva)"
        value={rank}
        min={0}
        max={6}
        onChange={setRank}
      />
      {Object.entries(spell.calculations).map(([name]) => {
        const result = evaluateFormula(spell, name, {
          level: config.level,
          rank,
          stats,
          base,
        });
        return (
          <View key={name} style={{ gap: 4 }}>
            <Text style={styles.text}>
              {name.replace(/([a-z])([A-Z])/g, "$1 $2")}
            </Text>
            <Label>
              {result.ok
                ? `${(result.value * (result.percent ? 100 : 1)).toLocaleString("es-MX", { maximumFractionDigits: 3 })}${result.percent ? "%" : ""}`
                : `No calculado: ${result.reason}`}
            </Label>
          </View>
        );
      })}
    </Card>
  );
}
