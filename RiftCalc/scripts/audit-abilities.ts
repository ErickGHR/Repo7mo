import fs from "node:fs";
import { abilityCatalog, abilityPatch } from "../src/data/abilities";
import { championById, supported } from "../src/data/catalog";
import { advancedChampions } from "../src/engine/champion-mechanics";
import { evaluateFormula } from "../src/engine/formulas";
import { calculateChampionStatsAtLevel } from "../src/engine/stats";
const rows: string[] = [];
let total = 0,
  interpretable = 0;
for (const [id, c] of Object.entries(abilityCatalog)) {
  let count = 0,
    ok = 0;
  const pending = new Set<string>();
  const stats = calculateChampionStatsAtLevel(championById[id], 11);
  for (const spell of Object.values(c.spells))
    for (const name of Object.keys(spell.calculations)) {
      count++;
      const result = evaluateFormula(spell, name, {
        level: 11,
        rank: 1,
        stats,
        base: stats,
      });
      if (result.ok) ok++;
      else pending.add(result.reason);
    }
  total += count;
  interpretable += ok;
  rows.push(
    `| ${c.name} | ${count} | ${ok} | ${supported.includes(id) || advancedChampions.includes(id) ? "Kit modelado (objetivo único)" : "Pendiente"} | ${[...pending].join("; ").replaceAll("|", "/")} |`,
  );
}
fs.writeFileSync(
  "design/COBERTURA-HABILIDADES.md",
  `# Cobertura de habilidades — ${abilityPatch}\n\n173 kits de referencia (Q/W/E/R y pasiva). 984 registros incluyendo variantes.\n\n${interpretable}/${total} expresiones numéricas se pueden evaluar en el escenario de auditoría (nivel 11, rango 1, sin objetos ni acumulaciones). Esto **no equivale** a habilidades simuladas ni verifica todas las combinaciones de nivel, rangos y estados. Los cálculos de tooltip no contienen por sí solos reglas de activación, temporización, formas o selección de objetivo.\n\nModelos automáticos de daño a un objetivo: ${[...supported, ...advancedChampions].join(", ")}. En estos seis se calculan Q/W/E/R, ataques, efectos de pasiva que cambian el daño/ataque y formas. Las utilidades sin efecto sobre daño saliente (curación propia, daño entrante y movilidad), eventos de baja con varios objetivos y efectos especiales de objetos se identifican aparte.\n\nLos otros ${173 - supported.length - advancedChampions.length} campeones siguen pendientes; tener sus descripciones y expresiones numéricas no cuenta como simulación.\n\n| Campeón | Expresiones | Evaluables en auditoría | Combate automático | Dependencias pendientes |\n|---|---:|---:|---|---|\n${rows.join("\n")}\n`,
);
console.log(
  `${interpretable}/${total} expresiones evaluables. Auditoría guardada.`,
);
