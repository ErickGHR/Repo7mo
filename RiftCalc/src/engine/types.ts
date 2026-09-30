export type Action = "AA" | "Q" | "W" | "E" | "R";
export type AbilityKey = Exclude<Action, "AA">;
export type DamageType = "physical" | "magic" | "true";
export interface Champion {
  id: string;
  name: string;
  title: string;
  tags: string[];
  image: { full: string };
  stats: Record<string, number>;
}
export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  tags: string[];
  image: { full: string };
  gold: { total: number; purchasable: boolean };
  maps: Record<string, boolean>;
  stats: Record<string, number>;
  requiredAlly?: string;
  requiredChampion?: string;
  inStore?: boolean;
}
export interface Rune {
  id: number;
  name: string;
  icon: string;
  longDesc: string;
  tree: number;
  slot: number;
}
export interface ChampionStats {
  hp: number;
  ad: number;
  baseAd: number;
  bonusAd: number;
  ap: number;
  armor: number;
  mr: number;
  as: number;
  bonusAs: number;
  itemAs: number;
  haste: number;
  crit: number;
  lethality: number;
  armorPen: number;
  magicPen: number;
  magicPenPercent: number;
}
export interface Target {
  maxHealth: number;
  health: number;
  armor: number;
  mr: number;
  shield: number;
  reduction: number;
  championId?: string;
  level: number;
}
export interface Buffs {
  allyEnabled: boolean;
  allyAp: number;
  allyAd: number;
  infernal: number;
  mountain: number;
  hextech: number;
  nearest: boolean;
  rocketMax: boolean;
  proc: boolean;
  electrocute: boolean;
  healthy: boolean;
  garenStacks: number;
}
export interface BuildConfiguration {
  mechanics?: { alternateForm: boolean };
  schema: 1;
  patch: string;
  championId: string;
  level: number;
  minute: number;
  ranks: Record<AbilityKey, number>;
  items: (string | null)[];
  runes: number[];
  shards: ("adaptive" | "as" | "haste" | "health")[];
  buffs: Buffs;
  target: Target;
  actions: Action[];
  name: string;
}
export interface DamageInstance {
  source: string;
  type: DamageType;
  raw: number;
  final: number;
  absorbed: number;
  healthDamage: number;
  formula: string;
  resistance: number;
  time: number;
}
export interface CombatState {
  health: number;
  shield: number;
  elapsedTime: number;
  armorReduction: number;
  magicReduction?: number;
  stacks: Record<string, number>;
  triggeredEffects: Set<string>;
  cooldowns: Record<string, number>;
  rockets: boolean;
}
export interface ItemEffect {
  id: string;
  name: string;
  trigger: "on-hit" | "on-spell";
  damageType: DamageType;
  cooldown: number;
  calculate: (stats: ChampionStats) => number;
}
export interface DamageResult {
  stats: ChampionStats;
  totalRawDamage: number;
  totalFinalDamage: number;
  physicalDamage: number;
  magicDamage: number;
  trueDamage: number;
  targetRemainingHealth: number;
  healthRemoved: number;
  sources: DamageInstance[];
  warnings: string[];
  included: string[];
}
