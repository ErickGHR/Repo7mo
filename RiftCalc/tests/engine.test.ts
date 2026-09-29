import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateTrueDamage,
  applyPenetration,
} from "../src/engine/resistance";
import {
  calculateChampionStatsAtLevel,
  calculateStats,
  extraItemStats,
  growthFactor,
} from "../src/engine/stats";
import { calculateScenario } from "../src/engine/scenario";
import { initialConfig, championById, itemById } from "../src/data/catalog";
import {
  normalizeRanks,
  validateConfiguration,
} from "../src/engine/validation";
import { BuildConfiguration } from "../src/engine/types";
const scenario = (
  overrides: Partial<BuildConfiguration> = {},
): BuildConfiguration => ({
  ...structuredClone(initialConfig),
  items: [null, null, null, null, null, null],
  runes: [],
  shards: ["haste", "health", "health"],
  ...overrides,
});
const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);
test("físico contra 0 de armadura", () =>
  assert.equal(calculatePhysicalDamage(100, 0), 100));
test("físico contra 100 de armadura", () =>
  assert.equal(calculatePhysicalDamage(100, 100), 50));
test("mágico contra 0 RM", () =>
  assert.equal(calculateMagicDamage(100, 0), 100));
test("mágico contra 50 RM", () => close(calculateMagicDamage(150, 50), 100));
test("verdadero ignora resistencias", () =>
  assert.equal(calculateTrueDamage(100), 100));
test("resistencia negativa amplifica", () =>
  close(calculateMagicDamage(100, -100), 150));
test("orden reducción y penetración; penetración no crea resistencia negativa", () => {
  close(applyPenetration(100, 0.4, 12, 10, 0.25), 28.5);
  assert.equal(applyPenetration(10, 0, 20), 0);
  assert.equal(applyPenetration(-20, 0.4, 12), -20);
});
test("crecimiento no lineal y nivel 18", () => {
  close(growthFactor(2), 0.72);
  close(growthFactor(18), 17);
  const s = championById.Ahri.stats;
  close(
    calculateChampionStatsAtLevel(championById.Ahri, 18).ad,
    s.attackdamage + 17 * s.attackdamageperlevel,
  );
});
test("AP de objetos y Rabadon", () => {
  const c = scenario({ items: ["1026", "3089", null, null, null, null] });
  close(
    calculateStats(c).ap,
    (itemById["1026"].stats.FlatMagicDamageMod + 130) * 1.3,
  );
});
test("penetración y aceleración ausentes en stats de DDragon", () => {
  close(extraItemStats(itemById["3020"]).magicPen, 12);
  close(extraItemStats(itemById["3135"]).magicPenPercent, 0.4);
  close(extraItemStats(itemById["3115"]).haste, 15);
});
test("Ahri Q aplica AP a ida y regreso", () => {
  const c = scenario({
    actions: ["Q"],
    items: ["1026", null, null, null, null, null],
  });
  const r = calculateScenario(c);
  close(r.totalRawDamage, 2 * (135 + 0.5 * r.stats.ap));
  assert.deepEqual(
    r.sources.map((x) => x.type),
    ["magic", "true"],
  );
});
test("Jinx W usa AD total", () => {
  const r = calculateScenario(scenario({ championId: "Jinx", actions: ["W"] }));
  close(r.totalRawDamage, 110 + 1.4 * r.stats.ad);
});
test("Jinx R usa AD adicional y vida faltante", () => {
  const c = scenario({
    championId: "Jinx",
    items: ["1036", null, null, null, null, null],
    actions: ["R"],
  });
  c.target.health = 1500;
  const r = calculateScenario(c);
  close(r.totalRawDamage, 350 + 1.2 * r.stats.bonusAd + 300);
});
test("Jinx Q modifica el siguiente ataque, no hace daño sola", () => {
  const c = scenario({ championId: "Jinx", actions: ["Q", "AA"] });
  const r = calculateScenario(c);
  assert.equal(r.sources.length, 1);
  close(r.totalRawDamage, 1.1 * r.stats.ad);
});
test("buff de aliado y 3 infernales", () => {
  const c = scenario();
  c.buffs = { ...c.buffs, allyEnabled: true, allyAp: 100, infernal: 3 };
  close(calculateStats(c).ap, 109);
});
test("Tormenta Creciente a minuto 20 y 30", () => {
  const c = scenario({ runes: [8236], minute: 20 });
  close(calculateStats(c).ap, 24);
  close(calculateStats({ ...c, minute: 30 }).ap, 48);
});
test("Electrocutar no se activa por los dos impactos de Q; se activa una vez por 3 acciones", () => {
  const c = scenario({ runes: [8112], actions: ["Q"] });
  assert.equal(
    calculateScenario(c).sources.filter((x) => x.source === "Electrocutar")
      .length,
    0,
  );
  c.actions = ["E", "Q", "W", "AA"];
  assert.equal(
    calculateScenario(c).sources.filter((x) => x.source === "Electrocutar")
      .length,
    1,
  );
});
test("Nashor solo en ataques, una vez por AA", () => {
  const c = scenario({
    items: ["3115", null, null, null, null, null],
    actions: ["Q", "AA", "AA"],
  });
  assert.equal(
    calculateScenario(c).sources.filter(
      (x) => x.source === "Mordida de Icathia",
    ).length,
    2,
  );
});
test("Garen E reduce armadura para el séptimo giro y siguiente ataque", () => {
  const r = calculateScenario(
    scenario({ championId: "Garen", actions: ["E", "AA"] }),
  );
  const spins = r.sources.filter((x) => x.source.startsWith("E"));
  close(spins[0].resistance, 90);
  close(spins[6].resistance, 67.5);
  close(r.sources.at(-1)!.resistance, 67.5);
});
test("Garen R usa vida restante después de Q", () => {
  const c = scenario({ championId: "Garen", actions: ["Q", "R"] });
  const r = calculateScenario(c);
  const q = r.sources[0];
  close(r.sources[1].raw, 200 + 0.3 * q.healthDamage);
});
test("escudo se consume en orden, vida no negativa y se detiene al morir", () => {
  const c = scenario({ actions: ["Q", "AA", "AA"] });
  c.target = { ...c.target, health: 10, shield: 20, armor: 0, mr: 0 };
  const r = calculateScenario(c);
  assert.equal(r.targetRemainingHealth, 0);
  assert.equal(r.healthRemoved, 10);
  close(
    r.sources.reduce((a, x) => a + x.absorbed, 0),
    20,
  );
  assert.ok(r.sources.length <= 2);
});
test("suma del desglose coincide con total y tipos", () => {
  const r = calculateScenario(scenario());
  close(r.totalFinalDamage, r.physicalDamage + r.magicDamage + r.trueDamage);
  close(r.targetRemainingHealth, 2500 - r.healthRemoved);
});
test("ranks respetan nivel, puntos totales y acceso a definitiva", () => {
  assert.deepEqual(normalizeRanks({ Q: 5, W: 3, E: 1, R: 2 }, 1), {
    Q: 1,
    W: 0,
    E: 0,
    R: 0,
  });
  const c = scenario({ level: 1 });
  assert.ok(validateConfiguration(c).length);
});
test("rechaza configuración de otro parche, NaN y objetos duplicados", () => {
  assert.throws(() => calculateScenario(scenario({ patch: "0.0.0" })));
  const c = scenario();
  c.target.mr = NaN;
  assert.throws(() => calculateScenario(c));
  assert.throws(() =>
    calculateScenario(
      scenario({ items: ["1026", "1026", null, null, null, null] }),
    ),
  );
});
test("campeón no soportado no inventa daño de habilidad", () => {
  const r = calculateScenario(
    scenario({ championId: "Akali", actions: ["Q"] }),
  );
  assert.equal(r.totalFinalDamage, 0);
  assert.ok(r.warnings.some((w) => w.includes("pendiente")));
});
test("calcular no muta el escenario", () => {
  const c = scenario(),
    before = structuredClone(c);
  calculateScenario(c);
  assert.deepEqual(c, before);
});
test("Nashor usa el coeficiente del parche 16.19 (15% AP)", () => {
  const c = scenario({
    items: ["3115", null, null, null, null, null],
    actions: ["AA"],
  });
  const r = calculateScenario(c);
  close(
    r.sources.find((s) => s.source === "Mordida de Icathia")!.raw,
    15 + 0.15 * r.stats.ap,
  );
});
test("Luden activa entre ida y regreso de Q y respeta cooldown", () => {
  const r = calculateScenario(
    scenario({
      items: ["6655", null, null, null, null, null],
      actions: ["Q", "W"],
    }),
  );
  assert.match(r.sources[1].source, /Luden/);
  assert.equal(r.sources.filter((s) => s.source.includes("Luden")).length, 1);
  close(r.sources[1].raw, 2 * (75 + 0.05 * r.stats.ap));
});
test("Brillo necesita habilidad y consume la carga", () => {
  const c = scenario({
    items: ["3057", null, null, null, null, null],
    actions: ["AA"],
  });
  assert.equal(calculateScenario(c).sources.length, 1);
  c.actions = ["Q", "AA", "AA"];
  assert.equal(
    calculateScenario(c).sources.filter((s) => s.source.includes("Brillo"))
      .length,
    1,
  );
});
test("AD por nivel y ratio AS complementarios del mismo parche", () => {
  close(calculateChampionStatsAtLevel(championById.Ahri, 18).ad, 104);
  close(calculateChampionStatsAtLevel(championById.Jinx, 18).ad, 114.25);
  close(
    calculateChampionStatsAtLevel(championById.Ahri, 18).as,
    0.668 + 0.625 * 0.022 * 17,
  );
});
test("fuerza adaptable favorece AD en Jinx sin AP", () => {
  const c = scenario({
    championId: "Jinx",
    shards: ["adaptive", "adaptive", "health"],
  });
  close(calculateStats(c).bonusAd, 10.8);
  close(calculateStats(c).ap, 0);
});
