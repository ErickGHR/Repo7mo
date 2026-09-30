import { test } from "node:test";
import assert from "node:assert/strict";
import overrides from "../src/data/stat-overrides.json";
import {
  champions,
  championById,
  patch,
  initialConfig,
  startingItems,
  itemById,
} from "../src/data/catalog";
import {
  calculateChampionStatsAtLevel,
  calculateStats,
  extraItemStats,
} from "../src/engine/stats";
const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);
test("snapshot completo y compatible: estadísticas finitas para todos los campeones", () => {
  assert.equal(overrides.patch, patch);
  assert.equal(champions.length, 173);
  assert.deepEqual(
    Object.keys(overrides.champions).sort(),
    champions.map((c) => c.id).sort(),
  );
  for (const champion of champions) {
    for (const level of [1, 11, 18]) {
      const stats = calculateChampionStatsAtLevel(champion, level);
      for (const value of Object.values(stats))
        assert.ok(Number.isFinite(value), champion.id);
      assert.ok(stats.ad > 0 && stats.hp > 0 && stats.as > 0, champion.id);
    }
  }
});
test("Akali y Azir recuperan AD por nivel; Azir usa su ratio AS propio", () => {
  close(calculateChampionStatsAtLevel(championById.Akali, 18).ad, 118.1);
  const azir = calculateChampionStatsAtLevel(championById.Azir, 18);
  close(azir.ad, 115.5);
  close(azir.as, 0.625 + 0.694 * 0.85);
});
test("ceros legítimos: Senna AD base, Thresh armadura, Jhin ratio AS", () => {
  close(calculateChampionStatsAtLevel(championById.Senna, 18).ad, 50);
  close(
    calculateChampionStatsAtLevel(championById.Thresh, 18).armor,
    championById.Thresh.stats.armor,
  );
  const config = structuredClone(initialConfig);
  config.championId = "Jhin";
  config.items = ["1042", null, null, null, null, null];
  close(calculateStats(config).as, 0.625);
});
test("Garen al máximo de W conserva las 30 resistencias acumuladas", () => {
  const c = structuredClone(initialConfig);
  c.championId = "Garen";
  c.items = [null, null, null, null, null, null];
  c.buffs.garenStacks = 150;
  const base = calculateChampionStatsAtLevel(championById.Garen, c.level);
  const stats = calculateStats(c);
  close(stats.armor, base.armor + 30);
  close(stats.mr, base.mr + 30);
});
test("objetos iniciales: filtro y estadísticas de Doran se reflejan en la build", () => {
  for (const id of ["1054", "1055", "1056", "1083", "2003", "2031", "3865"])
    assert.ok(startingItems.includes(id), id);
  const c = structuredClone(initialConfig);
  c.championId = "Ahri";
  c.items = ["1056", null, null, null, null, null];
  c.runes = [];
  const withRing = calculateStats(c);
  const bare = calculateStats({
    ...c,
    items: [null, null, null, null, null, null],
  });
  close(withRing.hp - bare.hp, 90);
  close(withRing.ap - bare.ap, 18);
  c.items = ["1055", null, null, null, null, null];
  close(extraItemStats(itemById["1055"]).omnivamp, 0.025);
  c.items = ["1053", null, null, null, null, null];
  close(extraItemStats(itemById["1053"]).lifeSteal, 0.07);
  c.items = ["1054", null, null, null, null, null];
  close(calculateStats(c).hpRegen - bare.hpRegen, 4);
  c.items = ["3865", null, null, null, null, null];
  const supportStart = calculateStats(c);
  close(supportStart.hpRegen, bare.hpRegen * 1.5);
  close(supportStart.manaRegen, bare.manaRegen * 1.25);
  close(supportStart.goldPer10, 3);
});
