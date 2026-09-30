import { test } from "node:test";
import assert from "node:assert/strict";
import {
  abilityCatalog,
  abilityPatch,
  findSpell,
  SpellRecord,
} from "../src/data/abilities";
import {
  champions,
  championById,
  initialConfig,
  patch,
} from "../src/data/catalog";
import { evaluateFormula, requireFormula } from "../src/engine/formulas";
import {
  calculateChampionStatsAtLevel,
  calculateStats,
} from "../src/engine/stats";
import { calculateScenario } from "../src/engine/scenario";
import {
  normalizeRanks,
  validateConfiguration,
} from "../src/engine/validation";
import { BuildConfiguration } from "../src/engine/types";
const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);
const config = (
  id: string,
  extra: Partial<BuildConfiguration> = {},
): BuildConfiguration => ({
  ...structuredClone(initialConfig),
  championId: id,
  level: 11,
  ranks: { Q: 1, W: 1, E: 1, R: 1 },
  items: [null, null, null, null, null, null],
  runes: [],
  shards: ["haste", "health", "health"],
  target: {
    level: 11,
    maxHealth: 10000,
    health: 10000,
    armor: 0,
    mr: 0,
    shield: 0,
    reduction: 0,
  },
  actions: ["Q"],
  ...extra,
});
test("catálogo de 173 kits: cuatro habilidades y pasiva por campeón con parche y hash de origen", () => {
  assert.equal(abilityPatch, patch);
  assert.deepEqual(
    Object.keys(abilityCatalog).sort(),
    champions.map((c) => c.id).sort(),
  );
  for (const c of Object.values(abilityCatalog)) {
    assert.deepEqual(
      c.abilities.map((a) => a.key),
      ["Q", "W", "E", "R"],
    );
    assert.ok(c.passive.name && c.passive.description);
    assert.match(c.sourceHash, /^[a-f0-9]{64}$/);
    for (const a of c.abilities) assert.ok(c.spells[a.path], a.path);
  }
});
test("evaluador: crecimiento, AP, AD adicional y multiplicadores del parche", () => {
  const c = config("Jayce");
  const base = calculateChampionStatsAtLevel(championById.Jayce, c.level);
  const ctx = {
    rank: 1,
    level: 11,
    base,
    stats: { ...base, ap: 100, ad: base.ad + 50, bonusAd: 50 },
  };
  close(
    requireFormula(
      findSpell("Jayce", "JayceShockBlast"),
      "EmpoweredDamage",
      ctx,
    ),
    (80 + 1.3 * 50) * 1.4,
  );
  close(
    requireFormula(
      findSpell("Lux", "LuxIlluminationPassive"),
      "TotalDamage",
      ctx,
    ),
    130 + 35,
  );
  close(
    requireFormula(findSpell("Jayce", "JayceStanceHtG"), "Resists", ctx),
    19 + 0.075 * 50,
  );
});
test("evaluador rechaza operación desconocida, referencia circular y acumulaciones ausentes", () => {
  const c = config("Nasus"),
    s = calculateStats(c),
    ctx = { rank: 1, level: 11, stats: s, base: s };
  assert.equal(
    evaluateFormula(findSpell("Nasus", "NasusQ"), "TotalDamage", ctx).ok,
    false,
  );
  const record: SpellRecord = {
    values: {},
    effects: [],
    calculations: {
      bad: { __type: "Unsupported" },
      cycle: {
        __type: "GameCalculationModified",
        mModifiedGameCalculation: "cycle",
      },
    },
  };
  assert.equal(evaluateFormula(record, "bad", ctx).ok, false);
  assert.equal(evaluateFormula(record, "cycle", ctx).ok, false);
  assert.equal(evaluateFormula(record, "missing", ctx).ok, false);
  const stacked = requireFormula(findSpell("Nasus", "NasusQ"), "TotalDamage", {
    ...ctx,
    buffs: { "{1b1d7345}": 200 },
  });
  close(stacked, s.ad + 30 + 200);
});
test("Lux: marca se consume una vez, R detona y renueva la marca, W no inflige daño", () => {
  const c = config("Lux", { actions: ["Q", "AA", "AA"] });
  const r = calculateScenario(c);
  assert.equal(
    r.sources.filter((s) => s.source === "P · Iluminación").length,
    1,
  );
  close(r.totalRawDamage, 80 + 130 + 2 * r.stats.ad);
  const combo = calculateScenario(config("Lux", { actions: ["Q", "R", "AA"] }));
  assert.equal(
    combo.sources.filter((s) => s.source === "P · Iluminación").length,
    2,
  );
  assert.equal(
    calculateScenario(config("Lux", { actions: ["W"] })).totalRawDamage,
    0,
  );
});
test("Jayce: R cambia el kit; portal potencia Q; W potencia exactamente tres ataques", () => {
  close(calculateScenario(config("Jayce")).totalRawDamage, 60);
  close(
    calculateScenario(config("Jayce", { actions: ["R", "Q"] })).totalRawDamage,
    80,
  );
  close(
    calculateScenario(config("Jayce", { actions: ["R", "E", "Q"] }))
      .totalRawDamage,
    112,
  );
  const c = config("Jayce", { actions: ["R", "W", "AA", "AA", "AA", "AA"] });
  const r = calculateScenario(c);
  assert.equal(
    r.sources.filter((s) => s.source === "W · Ataque con Hipercarga").length,
    3,
  );
  close(r.totalRawDamage, r.stats.ad * 3.1);
});
test("Elise: formas distinguen vida actual y faltante; R activa pasiva, E amplifica pasiva", () => {
  const c = config("Elise", {
    target: {
      level: 11,
      maxHealth: 2000,
      health: 1000,
      armor: 0,
      mr: 0,
      shield: 0,
      reduction: 0,
    },
  });
  close(calculateScenario(c).totalRawDamage, 80);
  close(
    calculateScenario({ ...c, mechanics: { alternateForm: true } })
      .totalRawDamage,
    50 + 80 + 14,
  );
  close(
    calculateScenario({ ...c, actions: ["R", "AA"] }).totalRawDamage,
    calculateStats(c).ad + 14,
  );
  close(
    calculateScenario({ ...c, actions: ["R", "E", "AA"] }).totalRawDamage,
    calculateStats(c).ad + 14 * 1.4,
  );
  assert.equal(
    calculateScenario({ ...c, actions: ["R", "R", "AA"] }).sources.length,
    1,
  );
});
test("rangos de transformación, 6 puntos de Jayce y persistencia del estado inicial", () => {
  const c = config("Jayce", {
    level: 18,
    ranks: { Q: 6, W: 6, E: 6, R: 1 },
    mechanics: { alternateForm: true },
  });
  assert.deepEqual(validateConfiguration(c), []);
  assert.deepEqual(normalizeRanks({ Q: 6, W: 6, E: 6, R: 3 }, 1, "Jayce"), {
    Q: 1,
    W: 0,
    E: 0,
    R: 1,
  });
  const elise = config("Elise", {
    level: 18,
    ranks: { Q: 5, W: 5, E: 5, R: 4 },
  });
  assert.deepEqual(validateConfiguration(elise), []);
  const roundtrip = JSON.parse(JSON.stringify(c));
  assert.deepEqual(calculateScenario(roundtrip), calculateScenario(c));
  const bad = {
    ...c,
    mechanics: { alternateForm: 1 },
  } as unknown as BuildConfiguration;
  assert.ok(validateConfiguration(bad).length);
});
test("fórmulas no interpretables no se convierten en daño cero ni afectan el combo genérico", () => {
  const c = config("Azir", { actions: ["Q"] });
  const result = calculateScenario(c);
  assert.equal(result.sources.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("habilidad no calculada")));
});
