import { test } from "node:test";
import assert from "node:assert/strict";
import overrides from "../src/data/stat-overrides.json";
import {
  champions,
  championById,
  patch,
  initialConfig,
} from "../src/data/catalog";
import {
  calculateChampionStatsAtLevel,
  calculateStats,
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
