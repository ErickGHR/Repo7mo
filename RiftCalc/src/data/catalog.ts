import riot from "./riot.json";
import overrides from "./stat-overrides.json";
import { Champion, Item, Rune, BuildConfiguration } from "../engine/types";
export const patch = riot.patch;
export const champions = Object.values(riot.champions).map((c) => ({
  ...c,
  stats: {
    ...c.stats,
    ...(riot.patch === overrides.patch
      ? overrides.champions[c.id as keyof typeof overrides.champions] || {}
      : {}),
  },
})) as Champion[];
export const championById = Object.fromEntries(champions.map((c) => [c.id, c]));
export const items = Object.entries(riot.items)
  .map(([id, i]) => ({ ...i, id }) as Item)
  .filter(
    (i) =>
      Number(i.id) < 10000 &&
      i.maps["11"] &&
      i.gold.purchasable &&
      i.inStore !== false &&
      !i.requiredAlly &&
      !i.requiredChampion,
  );
export const itemById = Object.fromEntries(items.map((i) => [i.id, i]));
export const runes: Rune[] = riot.runes.flatMap((t) =>
  t.slots.flatMap((s, slot) =>
    s.runes.map((r) => ({ ...r, tree: t.id, slot })),
  ),
);
export const runeTrees = riot.runes;
export const details = riot.details;
export const supported = ["Ahri", "Jinx", "Garen"];
export const supportedRunes = [8112, 8236, 8233, 8014];
export const asset = (group: string, file: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${patch}/img/${group}/${file}`;
export const strip = (s: string) =>
  s
    .replace(/<br\s*\/?\s*>/gi, " · ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ");
export const initialConfig: BuildConfiguration = {
  schema: 1,
  patch,
  championId: "Ahri",
  level: 11,
  minute: 22.5,
  ranks: { Q: 5, W: 3, E: 1, R: 2 },
  items: ["6655", "3020", "3089", null, null, null],
  runes: [8112, 8236],
  shards: ["adaptive", "adaptive", "health"],
  buffs: {
    allyEnabled: false,
    allyAp: 0,
    allyAd: 0,
    infernal: 0,
    mountain: 0,
    hextech: 0,
    nearest: true,
    rocketMax: true,
    proc: true,
    electrocute: true,
    healthy: true,
    garenStacks: 0,
  },
  target: {
    maxHealth: 2500,
    health: 2500,
    armor: 90,
    mr: 60,
    shield: 0,
    reduction: 0,
    level: 11,
  },
  actions: ["E", "Q", "W", "R", "AA"],
  name: "Ahri · Burst nivel 11",
};
