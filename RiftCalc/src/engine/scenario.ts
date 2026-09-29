import {
  Action,
  AbilityKey,
  BuildConfiguration,
  CombatState,
  DamageInstance,
  DamageResult,
  DamageType,
} from "./types";
import { calculateStats, growthFactor } from "./stats";
import { applyPenetration, resistanceMultiplier } from "./resistance";
import {
  itemById,
  supported,
  supportedRunes,
  championById,
} from "../data/catalog";
import models from "../data/models.json";
import { EFFECT_PATCH, itemEffects, modeledItems } from "./effects";
import { validateConfiguration } from "./validation";
type Model = Record<
  string,
  Record<AbilityKey, { values: Record<string, number[]> }>
>;
const modelData = models.champions as Model;
export const modelValue = (
  champion: string,
  ability: AbilityKey,
  name: string,
  rank: number,
) => modelData[champion]?.[ability].values[name]?.[rank] ?? 0;
export function calculateScenario(c: BuildConfiguration): DamageResult {
  const errors = validateConfiguration(c);
  if (errors.length) throw Error(errors.join(" "));
  const s = calculateStats(c),
    sources: DamageInstance[] = [],
    warnings: string[] = [],
    included = [
      "Estadísticas base + crecimiento por nivel",
      "Resistencias y penetración",
      "Vida y escudo consumidos en orden",
    ];
  const modelAvailable =
    supported.includes(c.championId) &&
    c.patch === models.patch &&
    c.patch === EFFECT_PATCH;
  if (!modelAvailable)
    warnings.push(
      "Modelo de daño avanzado pendiente: únicamente ataques básicos genéricos.",
    );
  if (!supported.includes(c.championId))
    warnings.push(
      "Estadísticas base verificadas. Pasivas, acumulaciones y transformaciones propias del campeón no incluidas.",
    );
  for (const id of c.items) {
    if (
      id &&
      !modeledItems.includes(id) &&
      /<passive>|<active>|<OnHit>/i.test(itemById[id].description)
    )
      warnings.push(
        `${itemById[id].name}: pasiva/activa no modelada; solo estadísticas publicadas.`,
      );
  }
  for (const id of c.runes) {
    if (!supportedRunes.includes(id))
      warnings.push(`Runa ${id}: efecto todavía no implementado.`);
  }
  if (c.items.some(Boolean))
    included.push(
      "Estadísticas de objetos; penetración y aceleración del texto oficial",
    );
  if (c.runes.some((id) => supportedRunes.includes(id)))
    included.push("Runas compatibles seleccionadas");
  if (c.buffs.infernal || c.buffs.mountain || c.buffs.hextech)
    included.push("Acumulaciones de dragones (sin almas)");
  if (c.items.includes("6655"))
    warnings.push(
      "Luden: se asumen 6 cargas y objetivo aislado; sin reparto a enemigos cercanos.",
    );
  if (modelAvailable)
    included.push(
      "Habilidades del modelo MVP; coeficientes de CommunityDragon del mismo parche",
    );
  if (s.crit > 0)
    warnings.push("Los golpes críticos no se simulan: ataques sin crítico.");
  if (c.championId === "Garen" && c.buffs.garenStacks === 150)
    warnings.push(
      "Garen W: amplificación de resistencias al máximo de acumulaciones pendiente.",
    );
  warnings.push(
    "Secuencia ideal: todos los impactos aciertan. No se validan maná, alcance ni enfriamientos de habilidades.",
  );
  const state: CombatState = {
    health: c.target.health,
    shield: c.target.shield,
    elapsedTime: 0,
    armorReduction: 0,
    stacks: {},
    triggeredEffects: new Set(),
    cooldowns: {},
    rockets: false,
  };
  let currentAction: Action = "AA";
  const emit = (
    source: string,
    type: DamageType,
    raw: number,
    formula: string,
  ) => {
    if (state.health <= 0) return;
    const resist =
      type === "physical"
        ? applyPenetration(
            c.target.armor,
            s.armorPen,
            s.lethality,
            0,
            state.armorReduction,
          )
        : type === "magic"
          ? applyPenetration(c.target.mr, s.magicPenPercent, s.magicPen)
          : 0;
    const amp =
      type !== "true" &&
      c.runes.includes(8014) &&
      state.health < c.target.maxHealth * 0.4
        ? 1.08
        : 1;
    const final =
      raw *
      (type === "true"
        ? 1
        : resistanceMultiplier(resist) * (1 - c.target.reduction / 100) * amp);
    const absorbed = Math.min(state.shield, final);
    state.shield -= absorbed;
    const healthDamage = Math.min(state.health, final - absorbed);
    state.health -= healthDamage;
    sources.push({
      source,
      type,
      raw,
      final,
      absorbed,
      healthDamage,
      formula,
      resistance: resist,
      time: state.elapsedTime,
    });
    if (
      currentAction !== "AA" &&
      !(c.championId === "Garen" && currentAction === "Q") &&
      c.items.includes("6655") &&
      c.buffs.proc &&
      !state.triggeredEffects.has("luden-action") &&
      (state.cooldowns["6655"] ?? 0) <= state.elapsedTime
    ) {
      state.triggeredEffects.add("luden-action");
      state.cooldowns["6655"] = state.elapsedTime + 12;
      emit(
        "Eco de Luden · objetivo aislado",
        "magic",
        itemEffects["6655"].calculate(s),
        "2 × (75 + 5% AP) · 6 cargas, 1 objetivo",
      );
    }
  };
  const onHit = () => {
    if (!c.buffs.proc || c.patch !== EFFECT_PATCH) return;
    for (const id of c.items) {
      const e = id ? itemEffects[id] : undefined;
      if (
        e &&
        e.trigger === "on-hit" &&
        (e.id !== "3057" || state.triggeredEffects.has("spellblade-ready")) &&
        (state.cooldowns[e.id] ?? 0) <= state.elapsedTime
      ) {
        state.cooldowns[e.id] = state.elapsedTime + e.cooldown;
        if (e.id === "3057") state.triggeredEffects.delete("spellblade-ready");
        emit(
          e.name,
          e.damageType,
          e.calculate(s),
          e.id === "3057" ? "100% AD base" : "15 + 15% AP",
        );
      }
    }
  };
  let firstHitTime: number | null = null,
    hitCount = 0;
  for (const action of c.actions) {
    if (state.health <= 0) break;
    if ((state.cooldowns["armor-shred-until"] ?? 0) <= state.elapsedTime)
      state.armorReduction = 0;
    if ((state.cooldowns["spellblade-until"] ?? 0) <= state.elapsedTime)
      state.triggeredEffects.delete("spellblade-ready");
    currentAction = action;
    state.triggeredEffects.delete("luden-action");
    if (
      action !== "AA" &&
      modelAvailable &&
      c.ranks[action] > 0 &&
      (state.cooldowns["3057"] ?? 0) <= state.elapsedTime
    ) {
      state.triggeredEffects.add("spellblade-ready");
      state.cooldowns["spellblade-until"] = state.elapsedTime + 10;
    }
    const before = sources.length;
    if (action === "AA") {
      emit(
        "Ataque básico",
        "physical",
        s.ad * (state.rockets ? 1.1 : 1),
        state.rockets ? "110% AD · cohete" : "100% AD",
      );
      onHit();
    } else if (!modelAvailable) {
      warnings.push(`${action}: habilidad no calculada.`);
    } else if (c.ranks[action] === 0) {
      warnings.push(`${action}: sin puntos asignados.`);
    } else {
      const rank = c.ranks[action],
        v = (name: string) => modelValue(c.championId, action, name, rank);
      if (c.championId === "Ahri") {
        if (action === "Q") {
          const d = v("BaseDamage") + 0.5 * s.ap;
          emit("Q · Ida", "magic", d, `${v("BaseDamage")} + 50% AP`);
          emit("Q · Regreso", "true", d, `${v("BaseDamage")} + 50% AP`);
        }
        if (action === "W") {
          const d = v("BaseDamage") + v("APRatio") * s.ap;
          emit("W · Primer fuego", "magic", d, `${v("BaseDamage")} + 40% AP`);
          emit(
            "W · Fuegos 2 y 3",
            "magic",
            2 * v("RepeatDamageMod") * d,
            "2 × 40% del primer fuego",
          );
        }
        if (action === "E")
          emit(
            "E · Encanto",
            "magic",
            v("BaseDamage") + v("APRatio") * s.ap,
            `${v("BaseDamage")} + 85% AP`,
          );
        if (action === "R")
          emit(
            "R · Un desplazamiento",
            "magic",
            v("RBaseDamage") + v("RAPCoefficient") * s.ap,
            `${v("RBaseDamage")} + 35% AP`,
          );
      }
      if (c.championId === "Jinx") {
        if (action === "Q") {
          state.rockets = !state.rockets;
          included.push(
            "Jinx Q cambia arma; el siguiente AA usa el arma activa",
          );
        }
        if (action === "W")
          emit(
            "W · ¡Chispas!",
            "physical",
            v("Damage") + v("ADRatio") * s.ad,
            `${v("Damage")} + 140% AD`,
          );
        if (action === "E")
          emit(
            "E · Una trampa",
            "magic",
            v("Damage") + s.ap,
            `${v("Damage")} + 100% AP`,
          );
        if (action === "R") {
          const base = v(c.buffs.rocketMax ? "MaxDamage" : "BaseDamage"),
            ratio = c.buffs.rocketMax ? 1.2 : 0.12;
          emit(
            "R · Cohete",
            "physical",
            base +
              ratio * s.bonusAd +
              (v("PercentDamage") / 100) * (c.target.maxHealth - state.health),
            `${base} + ${ratio * 100}% AD adicional + ${v("PercentDamage")}% vida faltante`,
          );
        }
      }
      if (c.championId === "Garen") {
        if (action === "Q") {
          emit(
            "Q · Ataque potenciado",
            "physical",
            v("BaseDamage") + v("tADRatio") * s.ad,
            `${v("BaseDamage")} + 150% AD (incluye AA)`,
          );
          onHit();
        }
        if (action === "W")
          included.push("Garen W defensiva: 0 daño al objetivo");
        if (action === "E") {
          const spins =
            v("NumTicks") +
            Math.floor(
              ((championById.Garen.stats.attackspeedperlevel *
                growthFactor(c.level)) /
                100 +
                s.itemAs) /
                v("ASPerTick"),
            );
          for (let i = 0; i < spins && state.health > 0; i++) {
            emit(
              `E · Giro ${i + 1}/${spins}`,
              "physical",
              (v("BaseDamagePerTick") + v("ADRatioPerTick") * s.ad) *
                (c.buffs.nearest ? 1 + v("NearestEnemyBonus") : 1),
              `${v("BaseDamagePerTick")} + ${(v("ADRatioPerTick") * 100).toFixed(0)}% AD${c.buffs.nearest ? " × 1.25" : ""}`,
            );
            if (i + 1 >= v("StacksToShred")) {
              state.armorReduction = v("ShredAmount");
              state.cooldowns["armor-shred-until"] =
                state.elapsedTime + 3 + v("ShredDuration");
            }
          }
          state.elapsedTime += 3;
        }
        if (action === "R")
          emit(
            "R · Justicia Demaciana",
            "true",
            v("BaseDamage") +
              v("ExecuteDamage") * (c.target.maxHealth - state.health),
            `${v("BaseDamage")} + ${(v("ExecuteDamage") * 100).toFixed(0)}% vida faltante`,
          );
      }
    }
    if (sources.length > before) {
      if (firstHitTime === null || state.elapsedTime - firstHitTime > 3) {
        firstHitTime = state.elapsedTime;
        hitCount = 0;
      }
      hitCount++;
      if (
        c.runes.includes(8112) &&
        c.buffs.electrocute &&
        hitCount >= 3 &&
        !state.triggeredEffects.has("electrocute")
      ) {
        emit(
          "Electrocutar",
          s.ap >= s.bonusAd / 0.6 ? "magic" : "physical",
          70 + 10 * (c.level - 1) + 0.1 * s.bonusAd + 0.05 * s.ap,
          "70–240 por nivel + 10% AD adicional + 5% AP",
        );
        state.triggeredEffects.add("electrocute");
      }
    }
    state.elapsedTime += action === "AA" ? 1 / s.as : 0.5;
  }
  const sum = (type?: DamageType) =>
    sources
      .filter((x) => !type || x.type === type)
      .reduce((a, x) => a + x.final, 0);
  return {
    stats: s,
    totalRawDamage: sources.reduce((a, x) => a + x.raw, 0),
    totalFinalDamage: sum(),
    physicalDamage: sum("physical"),
    magicDamage: sum("magic"),
    trueDamage: sum("true"),
    targetRemainingHealth: state.health,
    healthRemoved: c.target.health - state.health,
    sources,
    warnings: [...new Set(warnings)],
    included: [...new Set(included)],
  };
}
