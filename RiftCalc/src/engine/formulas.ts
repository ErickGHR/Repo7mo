import { CalculationNode, SpellRecord } from "../data/abilities";
import { ChampionStats } from "./types";
export interface FormulaContext {
  level: number;
  rank: number;
  stats: ChampionStats;
  base: ChampionStats;
  buffs?: Record<string, number>;
}
export type FormulaResult =
  { ok: true; value: number; percent: boolean } | { ok: false; reason: string };
const finite = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw Error(`Valor ausente o inválido: ${name}`);
  return value;
};
export function spellValue(
  spell: SpellRecord,
  name: string,
  rank: number,
): number {
  const key = Object.keys(spell.values).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return finite(key ? spell.values[key][rank] : undefined, name);
}
/** Evaluates numeric tooltip expressions, not cast behavior, triggers or damage types. */
export function evaluateFormula(
  spell: SpellRecord,
  name: string,
  context: FormulaContext,
): FormulaResult {
  try {
    if (
      !Number.isInteger(context.rank) ||
      context.rank < 0 ||
      context.rank > 6 ||
      !Number.isInteger(context.level) ||
      context.level < 1 ||
      context.level > 18
    )
      throw Error("Nivel o rango inválido");
    const visiting = new Set<string>();
    const stat = (node: CalculationNode) => {
      if (node["{a8cb9c14}"])
        throw Error("La fórmula necesita estadísticas de otra unidad");
      const id = node.mStat ?? 0,
        formula = node.mStatFormula ?? 0;
      const keys: Record<number, keyof ChampionStats> = {
        0: "ap",
        1: "armor",
        2: "ad",
        4: "as",
        6: "mr",
        8: "crit",
        12: "hp",
        29: "lethality",
      };
      const key = keys[id];
      if (!key || ![0, 1, 2].includes(formula))
        throw Error(`Estadística no interpretada: ${id}:${formula}`);
      if (id === 4 && formula === 2) return context.stats.bonusAs;
      const total = context.stats[key],
        base = context.base[key];
      return finite(
        formula === 0 ? total : formula === 1 ? base : total - base,
        `stat ${id}:${formula}`,
      );
    };
    const calculation = (key: string, rank: number, depth: number): number => {
      const entry = Object.entries(spell.calculations).find(
        ([k]) => k.toLowerCase() === key.toLowerCase(),
      );
      if (!entry) throw Error(`Cálculo ausente: ${key}`);
      const visitKey = `${entry[0]}:${rank}`;
      if (visiting.has(visitKey))
        throw Error("Referencia circular entre fórmulas");
      visiting.add(visitKey);
      const value = part(entry[1], rank, depth + 1);
      visiting.delete(visitKey);
      return value;
    };
    const part = (node: CalculationNode, rank: number, depth = 0): number => {
      if (!node || depth > 64)
        throw Error("Expresión inválida o demasiado profunda");
      const value = (key: string) => spellValue(spell, key, rank);
      const sub = (n: CalculationNode) => part(n, rank, depth + 1);
      const number = (key: string, fallback?: number) =>
        finite(node[key] ?? fallback, key);
      const sum = (parts: CalculationNode[]) =>
        parts.reduce((a, p) => a + sub(p), 0);
      let result: number;
      switch (node.__type) {
        case "GameCalculation":
          if (!Array.isArray(node.mFormulaParts))
            throw Error("Fórmula sin componentes");
          result =
            sum(node.mFormulaParts) *
            (node.mMultiplier ? sub(node.mMultiplier) : 1);
          break;
        case "GameCalculationModified":
          result =
            calculation(
              node.mModifiedGameCalculation,
              node.mOverrideSpellLevel ?? rank,
              depth + 1,
            ) * (node.mMultiplier ? sub(node.mMultiplier) : 1);
          break;
        case "NumberCalculationPart":
          result = number("mNumber", 0);
          break;
        case "NamedDataValueCalculationPart":
          result = value(node.mDataValue);
          break;
        case "StatByNamedDataValueCalculationPart":
          result = stat(node) * value(node.mDataValue);
          break;
        case "StatByCoefficientCalculationPart":
          result = stat(node) * number("mCoefficient", 0);
          break;
        case "StatBySubPartCalculationPart":
          result = stat(node) * sub(node.mSubpart);
          break;
        case "SumOfSubPartsCalculationPart":
          result = sum(node.mSubparts);
          break;
        case "ProductOfSubPartsCalculationPart":
          result = sub(node.mPart1) * sub(node.mPart2);
          break;
        case "ClampSubPartsCalculationPart":
          result = Math.max(
            node.mFloor === undefined ? -Infinity : number("mFloor"),
            Math.min(
              node.mCeiling === undefined ? Infinity : number("mCeiling"),
              sum(node.mSubparts),
            ),
          );
          break;
        case "ByCharLevelInterpolationCalculationPart": {
          const fraction = node.mScaleByStatProgressionMultiplier
            ? ((0.7025 + 0.0175 * (context.level - 1)) * (context.level - 1)) /
              17
            : (context.level - 1) / 17;
          result =
            number("mStartValue", 0) +
            (number("mEndValue", 0) - number("mStartValue", 0)) * fraction;
          break;
        }
        case "ByCharLevelBreakpointsCalculationPart": {
          result = number("mLevel1Value", 0);
          let perLevel = number("mInitialBonusPerLevel", 0);
          for (let level = 2; level <= context.level; level++) {
            for (const point of node.mBreakpoints || [])
              if (point.mLevel === level) {
                result += finite(
                  point.mAdditionalBonusAtThisLevel ?? 0,
                  "breakpoint",
                );
                if (point.mBonusPerLevelAtAndAfter !== undefined)
                  perLevel = finite(
                    point.mBonusPerLevelAtAndAfter,
                    "per level",
                  );
              }
            result += perLevel;
          }
          break;
        }
        case "ByCharLevelFormulaCalculationPart":
          result = finite(node.values?.[context.level], "level table");
          break;
        case "CooldownMultiplierCalculationPart":
          result = 100 / (100 + context.stats.haste);
          break;
        case "BuffCounterByNamedDataValueCalculationPart":
        case "BuffCounterByCoefficientCalculationPart": {
          const stacks = context.buffs?.[node.mBuffName];
          result =
            finite(stacks, `acumulaciones ${node.mBuffName}`) *
            (node.mDataValue
              ? value(node.mDataValue)
              : number("mCoefficient", 0));
          break;
        }
        default:
          throw Error(`Operación pendiente de interpretar: ${node.__type}`);
      }
      return finite(result, node.__type);
    };
    const value = calculation(name, context.rank, 0);
    return {
      ok: true,
      value,
      percent: !!spell.calculations[name]?.mDisplayAsPercent,
    };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error ? error.message : "Fórmula no interpretable",
    };
  }
}
export function requireFormula(
  spell: SpellRecord,
  name: string,
  context: FormulaContext,
): number {
  const result = evaluateFormula(spell, name, context);
  if (!result.ok) throw Error(result.reason);
  return result.value;
}
