import { AbilityKey, BuildConfiguration } from "./types";
import { championById, itemById, patch, runes } from "../data/catalog";
export const maxRank = (key: AbilityKey, level: number, championId?: string) =>
  championId === "Jayce"
    ? key === "R"
      ? 1
      : Math.min(6, Math.ceil(level / 2))
    : ["Elise", "Nidalee", "Karma"].includes(championId || "") && key === "R"
      ? 1 + (level >= 6 ? 1 : 0) + (level >= 11 ? 1 : 0) + (level >= 16 ? 1 : 0)
      : championId === "Udyr"
        ? Math.min(level >= 16 ? 6 : 5, Math.ceil(level / 2))
        : key === "R"
          ? level >= 16
            ? 3
            : level >= 11
              ? 2
              : level >= 6
                ? 1
                : 0
          : Math.min(5, Math.ceil(level / 2));
export function normalizeRanks(
  ranks: BuildConfiguration["ranks"],
  level: number,
  championId?: string,
) {
  const r = { ...ranks };
  const freeR = ["Jayce", "Elise", "Nidalee", "Karma"].includes(
    championId || "",
  )
    ? 1
    : 0;
  r.R = Math.max(freeR, r.R);
  let remaining = level + freeR;
  for (const k of ["R", "Q", "W", "E"] as AbilityKey[]) {
    r[k] = Math.min(
      Math.max(0, r[k]),
      maxRank(k, level, championId),
      remaining,
    );
    remaining -= r[k];
  }
  return r;
}
export function validateConfiguration(c: BuildConfiguration): string[] {
  const errors: string[] = [];
  const finite = (n: number, min: number, max: number) =>
    Number.isFinite(n) && n >= min && n <= max;
  if (typeof c.name !== "string" || c.name.length > 80)
    errors.push("Nombre de build inválido.");
  if (c.schema !== 1 || c.patch !== patch)
    errors.push("La configuración pertenece a otro parche o formato.");
  if (!championById[c.championId]) errors.push("Campeón inexistente.");
  if (!finite(c.level, 1, 18) || !Number.isInteger(c.level))
    errors.push("Nivel inválido.");
  if (!finite(c.minute, 0, 180)) errors.push("Minuto inválido.");
  if (
    !c.ranks ||
    Object.values(c.ranks).reduce((a, b) => a + b, 0) >
      c.level +
        (["Jayce", "Elise", "Nidalee", "Karma"].includes(c.championId)
          ? 1
          : 0) ||
    (["Q", "W", "E", "R"] as AbilityKey[]).some(
      (k) =>
        !Number.isInteger(c.ranks[k]) ||
        !finite(c.ranks[k], 0, maxRank(k, c.level, c.championId)),
    )
  )
    errors.push("Distribución de habilidades inválida.");
  if (
    !Array.isArray(c.items) ||
    c.items.length !== 6 ||
    c.items.some((id) => id && !itemById[id])
  )
    errors.push("Inventario inválido.");
  if (c.items.filter(Boolean).length !== new Set(c.items.filter(Boolean)).size)
    errors.push("No se permiten objetos duplicados en este MVP.");
  if (
    !Array.isArray(c.actions) ||
    c.actions.length > 30 ||
    c.actions.some((a) => !["AA", "Q", "W", "E", "R"].includes(a))
  )
    errors.push("Combo inválido.");
  if (
    !Array.isArray(c.runes) ||
    c.runes.length > 6 ||
    new Set(c.runes).size !== c.runes.length ||
    c.runes.some((id) => !runes.some((r) => r.id === id))
  )
    errors.push("Runas inválidas.");
  if (
    !Array.isArray(c.shards) ||
    c.shards.length !== 3 ||
    c.shards.some(
      (s, i) =>
        !(
          i === 0
            ? ["adaptive", "as", "haste"]
            : i === 1
              ? ["adaptive", "health"]
              : ["health"]
        ).includes(s),
    )
  )
    errors.push("Fragmentos inválidos.");
  if (
    ["Jayce", "Elise", "Nidalee", "Karma"].includes(c.championId) &&
    c.ranks?.R < 1
  )
    errors.push("Este campeón comienza con R desbloqueada.");
  if (
    c.mechanics !== undefined &&
    (!c.mechanics || typeof c.mechanics.alternateForm !== "boolean")
  )
    errors.push("Estado de transformación inválido.");
  const t = c.target;
  if (
    !t ||
    !Number.isInteger(t.level) ||
    !finite(t.level, 1, 18) ||
    (t.championId !== undefined && !championById[t.championId]) ||
    !finite(t.maxHealth, 1, 100000) ||
    !finite(t.health, 0, t.maxHealth) ||
    !finite(t.armor, -500, 5000) ||
    !finite(t.mr, -500, 5000) ||
    !finite(t.shield, 0, 100000) ||
    !finite(t.reduction, 0, 100)
  )
    errors.push("Estadísticas del objetivo inválidas.");
  const b = c.buffs;
  if (
    !b ||
    (
      [
        "allyEnabled",
        "nearest",
        "rocketMax",
        "proc",
        "electrocute",
        "healthy",
      ] as const
    ).some((k) => typeof b[k] !== "boolean") ||
    !finite(b.allyAp, 0, 2000) ||
    !finite(b.allyAd, 0, 2000) ||
    !finite(b.garenStacks, 0, 150) ||
    (["infernal", "mountain", "hextech"] as const).some(
      (k) => !Number.isInteger(b[k]) || !finite(b[k], 0, 4),
    ) ||
    b.infernal + b.mountain + b.hextech > 4
  )
    errors.push("Buffs inválidos (máximo 4 dragones en total).");
  return errors;
}
