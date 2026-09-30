import { abilityCatalog, findSpell } from "../data/abilities";
import { championById } from "../data/catalog";
import { requireFormula, spellValue } from "./formulas";
import { calculateChampionStatsAtLevel } from "./stats";
import {
  Action,
  BuildConfiguration,
  ChampionStats,
  CombatState,
  DamageType,
} from "./types";
export const advancedChampions = ["Lux", "Jayce", "Elise"];
export const transformationForms: Record<string, [string, string]> = {
  Jayce: ["Martillo", "Cañón"],
  Elise: ["Humana", "Arácnida"],
};
export interface MechanicsContext {
  config: BuildConfiguration;
  stats: ChampionStats;
  state: CombatState;
  emit: (
    source: string,
    type: DamageType,
    raw: number,
    formula: string,
  ) => void;
  onHit: () => void;
  included: string[];
  warnings: string[];
}
export function createMechanics({
  config: c,
  stats: s,
  state,
  emit,
  onHit,
  included,
  warnings,
}: MechanicsContext) {
  if (!advancedChampions.includes(c.championId)) return null;
  const base = calculateChampionStatsAtLevel(
    championById[c.championId],
    c.level,
  );
  const catalog = abilityCatalog[c.championId];
  let alternate = c.mechanics?.alternateForm ?? false;
  const calc = (spell: string, name: string, rank: number) =>
    requireFormula(findSpell(c.championId, spell), name, {
      level: c.level,
      rank,
      stats: s,
      base,
    });
  const value = (spell: string, name: string, rank: number) =>
    spellValue(findSpell(c.championId, spell), name, rank);
  const damage = (
    spell: string,
    name: string,
    rank: number,
    type: DamageType,
    label: string,
    multiplier = 1,
  ) =>
    emit(
      label,
      type,
      calc(spell, name, rank) * multiplier,
      `${spell} / ${name}${multiplier !== 1 ? ` × ${multiplier}` : ""}`,
    );
  const until: Record<string, number> = {};
  const live = (key: string) => (until[key] ?? 0) > state.elapsedTime;
  let hyperAttacks = 0,
    firstAfterTransform = false;
  const originalAS = s.as,
    originalArmor = s.armor,
    originalMR = s.mr;
  const spiderlingCap =
    c.championId === "Elise"
      ? value("EliseR", "BaseSpiderlingsStored", c.ranks.R)
      : 0;
  let spiderlings = Math.min(
    spiderlingCap,
    c.mechanics?.spiderlings ?? spiderlingCap,
  );
  const prepare = () => {
    if (c.championId === "Jayce") {
      const resists = alternate ? 0 : calc("JayceStanceHtG", "Resists", 1);
      s.armor = originalArmor + resists;
      s.mr = originalMR + resists;
      s.as = live("hyper") && hyperAttacks > 0 ? 2.5 : originalAS;
      if (!live("shred")) {
        state.armorReduction = 0;
        state.magicReduction = 0;
      }
    }
    if (c.championId === "Elise") {
      const passiveAs = value("EliseSpiderW", "PassiveAttackSpeed", c.ranks.W);
      const activeAs = live("frenzy")
        ? value("EliseSpiderW", "ActiveAttackSpeed", c.ranks.W)
        : 0;
      s.as = Math.min(2.5, originalAS * (1 + passiveAs + activeAs));
    }
  };
  const spiderlingStrikes = () => {
    if (!spiderlings) return;
    damage(
      "EliseR",
      "SpiderlingTotalDamage",
      c.ranks.R,
      "magic",
      `P · Arañitas × ${spiderlings}`,
      spiderlings,
    );
  };
  const storeSpiderling = () => {
    const before = spiderlings;
    spiderlings = Math.min(spiderlingCap, spiderlings + 1);
    if (spiderlings > before)
      included.push(
        `Elise P: acumula arañita (${spiderlings}/${spiderlingCap}).`,
      );
  };
  const elisePassive = () => {
    if (!alternate) return;
    const amp = live("rappel")
      ? 1 + value("EliseSpiderEInitial", "PBonusIncrease", c.ranks.E)
      : 1;
    damage(
      "EliseR",
      "PassiveTotalDamage",
      c.ranks.R,
      "magic",
      "P · Reina de las Arañas",
      amp,
    );
    included.push(
      `Elise: curación por impacto ${(calc("EliseR", "PassiveTotalHealing", c.ranks.R) * amp).toFixed(1)} (no cambia la vida del objetivo).`,
    );
    spiderlingStrikes();
  };
  const luxPassive = () => {
    if (!live("illumination")) return;
    until.illumination = 0;
    damage(
      "LuxIlluminationPassive",
      "TotalDamage",
      0,
      "magic",
      "P · Iluminación",
    );
  };
  if (c.championId === "Elise")
    included.push(
      `Elise P: ${spiderlings}/${spiderlingCap} arañitas al inicio; cada habilidad humana que acierta genera una hasta el límite.`,
    );
  if (c.championId === "Jayce")
    warnings.push(
      "Jayce: W de martillo acumula los 4 segundos completos antes de la siguiente acción; movimiento y regeneración de maná no simulados.",
    );
  if (c.championId === "Lux")
    warnings.push(
      "Lux: el escudo de W se informa por trayecto; no se simula daño recibido.",
    );
  prepare();
  return {
    prepare,
    act(action: Action): boolean {
      if (action === "AA") {
        if (c.championId === "Lux") {
          emit("Ataque básico", "physical", s.ad, "100% AD");
          luxPassive();
          onHit();
          return true;
        }
        if (c.championId === "Elise") {
          emit("Ataque básico", "physical", s.ad, "100% AD");
          elisePassive();
          onHit();
          return true;
        }
        if (c.championId === "Jayce") {
          if (live("hyper") && hyperAttacks > 0) {
            damage(
              "JayceHyperCharge",
              "ActualDamage",
              c.ranks.W,
              "physical",
              "W · Ataque con Hipercarga",
            );
            hyperAttacks--;
          } else emit("Ataque básico", "physical", s.ad, "100% AD");
          if (firstAfterTransform) {
            firstAfterTransform = false;
            if (alternate) {
              const shred = calc("JayceStanceHtG", "RangedFormShred", 1);
              state.armorReduction = shred;
              state.magicReduction = shred;
              until.shred =
                state.elapsedTime + value("JayceStanceHtG", "ShredDuration", 1);
              state.cooldowns["armor-shred-until"] = until.shred;
              included.push(
                "Jayce: primer AA de cañón reduce armadura y RM para impactos posteriores.",
              );
            } else
              damage(
                "JayceStanceHtG",
                "Damage",
                1,
                "magic",
                "Transformación · Primer golpe de martillo",
              );
          }
          onHit();
          return true;
        }
      }
      if (action === "AA") return false;
      const rank = c.ranks[action];
      if (rank === 0) return false;
      if (c.championId === "Lux") {
        const path = catalog.abilities.find((a) => a.key === action)!.path;
        if (action === "W")
          included.push(
            `Lux W: escudo ${calc(path, "TotalShieldTT", rank).toFixed(1)} por trayecto.`,
          );
        else {
          if (action === "R") luxPassive();
          damage(
            path,
            action === "R" ? "TotalDamage" : "TotalDamageTT",
            rank,
            "magic",
            `${action} · ${catalog.abilities.find((a) => a.key === action)!.name}`,
          );
          until.illumination =
            state.elapsedTime +
            value("LuxIlluminationPassive", "DebuffDuration", 0);
        }
        return true;
      }
      if (action === "R") {
        alternate = !alternate;
        firstAfterTransform = true;
        included.push(
          `${c.championId}: transformación a ${transformationForms[c.championId][alternate ? 1 : 0]}. ${c.championId === "Jayce" ? `Pasiva: +${value("JaycePassive", "FlatMovementSpeed", 0)} de velocidad de movimiento e ignora colisiones durante ${value("JaycePassive", "MovementSpeedDuration", 0)} s; no modifica daño.` : ""}`,
        );
        prepare();
        return true;
      }
      if (c.championId === "Jayce") {
        if (action === "Q")
          damage(
            alternate ? "JayceShockBlast" : "JayceToTheSkies",
            alternate && live("gate") ? "EmpoweredDamage" : "Damage",
            rank,
            "physical",
            alternate ? "Q · Descarga Eléctrica" : "Q · ¡Hacia los cielos!",
          );
        if (action === "W") {
          if (alternate) {
            hyperAttacks = value("JayceHyperCharge", "NumAttacks", rank);
            until.hyper =
              state.elapsedTime + value("JayceHyperCharge", "Duration", rank);
          } else {
            damage(
              "JayceStaticField",
              "Damage",
              rank,
              "magic",
              "W · Campo de Rayos completo",
            );
            state.elapsedTime += value("JayceStaticField", "Duration", rank);
          }
        }
        if (action === "E") {
          if (alternate)
            until.gate =
              state.elapsedTime +
              value("JayceAccelerationGate", "Duration", rank);
          else
            emit(
              "E · Golpe Relámpago",
              "magic",
              calc("JayceThunderingBlow", "FlatDamage", rank) +
                value("JayceThunderingBlow", "PercHPDamage", rank) *
                  c.target.maxHealth,
              "AD adicional + porcentaje de vida máxima",
            );
        }
        return true;
      }
      if (c.championId === "Elise") {
        if (action === "Q") {
          const spell = alternate ? "EliseSpiderQCast" : "EliseHumanQ";
          const ratio = calc(
            spell,
            alternate ? "MissingHPDamage" : "HumanPercentHealth",
            rank,
          );
          emit(
            alternate ? "Q · Mordida Venenosa" : "Q · Neurotoxina",
            "magic",
            value(spell, "BaseDamage", rank) +
              ratio *
                (alternate ? c.target.maxHealth - state.health : state.health),
            "Daño base + porcentaje de vida " +
              (alternate ? "faltante" : "actual"),
          );
          if (alternate) {
            elisePassive();
            onHit();
          } else storeSpiderling();
        }
        if (action === "W") {
          if (alternate)
            until.frenzy =
              state.elapsedTime + value("EliseSpiderW", "BuffDuration", rank);
          else
            damage(
              "EliseHumanW",
              "TotalDamage",
              rank,
              "magic",
              "W · Araña Volátil",
            );
          if (!alternate) storeSpiderling();
        }
        if (action === "E") {
          if (alternate) {
            until.rappel =
              state.elapsedTime +
              value("EliseSpiderEInitial", "BuffDuration", rank);
            included.push(
              "Elise E: descenso sobre el objetivo; pasiva amplificada durante 5 s.",
            );
          } else
            included.push(
              `Elise E: aturdimiento ${calc("EliseHumanE", "TotalStunDuration", rank).toFixed(1)} s; sin daño directo.`,
            );
          if (!alternate) storeSpiderling();
        }
        return true;
      }
      return false;
    },
  };
}
