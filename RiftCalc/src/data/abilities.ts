import data from "./abilities.json";
import { AbilityKey } from "../engine/types";
// Vendor expressions are interpreted by an allowlist, never executed as code.
export interface CalculationNode {
  __type: string;
  [key: string]: any;
}
export interface SpellRecord {
  values: Record<string, number[]>;
  calculations: Record<string, CalculationNode>;
  effects: { value?: number[] }[];
}
export interface AbilityInfo {
  key: AbilityKey;
  id: string;
  name: string;
  description: string;
  image: { full: string };
  maxrank: number;
  path: string;
}
export interface ChampionAbilities {
  name: string;
  passive: {
    name: string;
    description: string;
    image: { full: string };
    path: string | null;
  };
  abilities: AbilityInfo[];
  spells: Record<string, SpellRecord>;
  sourceHash: string;
}
export const abilityPatch = data.patch;
export const abilitySource = data.source;
export const abilityCatalog = data.champions as unknown as Record<
  string,
  ChampionAbilities
>;
export function findSpell(champion: string, name: string): SpellRecord {
  const entry = Object.entries(abilityCatalog[champion]?.spells || {}).find(
    ([path]) => path === name || path.endsWith("/" + name),
  );
  if (!entry) throw Error(`Registro no disponible: ${champion}/${name}`);
  return entry[1];
}
