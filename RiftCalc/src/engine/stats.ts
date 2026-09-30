import { Champion, ChampionStats, BuildConfiguration, Item } from "./types";
import {
  championById,
  itemById,
  itemStatOverrides,
  patch,
} from "../data/catalog";
import { EFFECT_PATCH } from "./effects";
export const growthFactor = (level: number) =>
  (0.7025 + 0.0175 * (level - 1)) * (level - 1);
export function calculateChampionStatsAtLevel(
  c: Champion,
  level: number,
): ChampionStats {
  const g = growthFactor(level),
    s = c.stats;
  const ad = s.attackdamage + s.attackdamageperlevel * g;
  const bonusAs = (s.attackspeedperlevel * g) / 100;
  return {
    hp: s.hp + s.hpperlevel * g,
    mana: s.mp + s.mpperlevel * g,
    hpRegen: s.hpregen + s.hpregenperlevel * g,
    manaRegen: s.mpregen + s.mpregenperlevel * g,
    moveSpeed: s.movespeed,
    ad,
    baseAd: ad,
    bonusAd: 0,
    ap: 0,
    armor: s.armor + s.armorperlevel * g,
    mr: s.spellblock + s.spellblockperlevel * g,
    as: s.attackspeed + (s.attackspeedratio ?? s.attackspeed) * bonusAs,
    bonusAs,
    itemAs: 0,
    haste: 0,
    crit: 0,
    lethality: 0,
    armorPen: 0,
    magicPen: 0,
    magicPenPercent: 0,
    lifeSteal: 0,
    omnivamp: 0,
    goldPer10: 0,
  };
}
/** DDragon omits some stats from stats; read explicit numeric text only inside its stats block. */
export function extraItemStats(item: Item) {
  const text = (
    item.description.match(/<stats>([\s\S]*?)<\/stats>/)?.[1] || ""
  ).replace(/<[^>]+>/g, " ");
  const read = (label: string) =>
    Number(
      text.match(
        new RegExp("(\\d+(?:\\.\\d+)?)\\s*(%)?\\s*(?:de\\s+)?" + label, "i"),
      )?.[1] || 0,
    );
  return {
    haste: read("Aceleración de Habilidad"),
    lethality: read("Letalidad"),
    magicPen: /\d+\s*%\s*(?:de\s+)?Penetración de Magia/i.test(text)
      ? 0
      : read("Penetración de Magia"),
    magicPenPercent: /\d+\s*%\s*(?:de\s+)?Penetración de Magia/i.test(text)
      ? read("Penetración de Magia") / 100
      : 0,
    armorPen: read("Penetración de Armadura") / 100,
    hpRegenPercent:
      (itemStatOverrides[item.id]?.hpRegenPercent || 0) +
      read("Regen\\. de Vida Básica") / 100,
    manaRegenPercent:
      (itemStatOverrides[item.id]?.manaRegenPercent || 0) +
      read("Regen\\. de Maná Básica") / 100,
    goldPer10: itemStatOverrides[item.id]?.goldPer10 || 0,
    lifeSteal: item.stats.PercentLifeStealMod || 0,
    omnivamp: read("Omnivampirismo") / 100,
  };
}
export function calculateStats(c: BuildConfiguration): ChampionStats {
  const s = calculateChampionStatsAtLevel(championById[c.championId], c.level);
  for (const id of c.items) {
    if (!id) continue;
    const item = itemById[id];
    if (!item) continue;
    const i = item.stats,
      x = extraItemStats(item);
    s.hp += i.FlatHPPoolMod || 0;
    s.ad += i.FlatPhysicalDamageMod || 0;
    s.ap += i.FlatMagicDamageMod || 0;
    s.armor += i.FlatArmorMod || 0;
    s.mr += i.FlatSpellBlockMod || 0;
    s.mana += i.FlatMPPoolMod || 0;
    s.hpRegen += s.hpRegen * (x.hpRegenPercent || 0);
    s.manaRegen += s.manaRegen * (x.manaRegenPercent || 0);
    s.moveSpeed += i.FlatMovementSpeedMod || 0;
    s.moveSpeed *= 1 + (i.PercentMovementSpeedMod || 0);
    s.hpRegen += (i.FlatHPRegenMod || 0) * 5;
    s.lifeSteal += x.lifeSteal || 0;
    s.omnivamp += x.omnivamp || 0;
    s.goldPer10 += x.goldPer10 || 0;
    s.itemAs += i.PercentAttackSpeedMod || 0;
    s.crit += i.FlatCritChanceMod || 0;
    s.haste += x.haste;
    s.lethality += x.lethality;
    s.magicPen += x.magicPen;
    s.magicPenPercent = 1 - (1 - s.magicPenPercent) * (1 - x.magicPenPercent);
    s.armorPen = 1 - (1 - s.armorPen) * (1 - x.armorPen);
  }
  let adaptive = c.shards.filter((v) => v === "adaptive").length * 9;
  if (c.runes.includes(8236)) {
    const n = Math.floor(c.minute / 10);
    adaptive += 4 * n * (n + 1);
  }
  if (c.runes.includes(8233) && c.buffs.healthy)
    adaptive += 3 + (27 * (c.level - 1)) / 17;
  if (
    s.ap > (s.ad - s.baseAd) / 0.6 ||
    (s.ap === (s.ad - s.baseAd) / 0.6 &&
      championById[c.championId].tags.includes("Mage"))
  )
    s.ap += adaptive;
  else s.ad += adaptive * 0.6;
  s.bonusAs += s.itemAs + c.shards.filter((v) => v === "as").length * 0.1;
  s.haste += c.shards.filter((v) => v === "haste").length * 8;
  s.hp +=
    c.shards.filter((v) => v === "health").length *
    (10 + (170 * (c.level - 1)) / 17);
  if (c.buffs.allyEnabled) {
    s.ap += c.buffs.allyAp;
    s.ad += c.buffs.allyAd;
  }
  if (c.championId === "Garen") {
    const resist = Math.min(30, c.buffs.garenStacks * 0.2);
    s.armor += resist;
    s.mr += resist;
  }
  if (c.patch === EFFECT_PATCH) {
    s.ap *= 1 + 0.03 * c.buffs.infernal;
    s.ad *= 1 + 0.03 * c.buffs.infernal;
    s.armor *= 1 + 0.05 * c.buffs.mountain;
    s.mr *= 1 + 0.05 * c.buffs.mountain;
    s.haste += 5 * c.buffs.hextech;
    s.bonusAs += 0.05 * c.buffs.hextech;
    if (c.items.includes("3089")) s.ap *= 1.3;
  }
  const base = championById[c.championId].stats;
  s.as = Math.min(
    2.5,
    base.attackspeed + (base.attackspeedratio ?? base.attackspeed) * s.bonusAs,
  );
  s.crit = Math.min(1, s.crit);
  s.bonusAd = s.ad - s.baseAd;
  return s;
}
